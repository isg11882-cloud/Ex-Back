import { buildSystemPrompt, phaseFromDays, type UserContext } from '@/lib/ai-system-prompt'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'edge'

// Gemini 모델 (무료 티어 할당량 이슈 우회를 위해 flash-latest 사용)
const AI_MODEL = process.env.GEMMA_MODEL_ID || 'gemini-flash-latest'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>
}

/**
 * Phase 2-A — AI Contextual Memory
 *
 * 로그인 사용자라면 profiles 캐시(breakup_type, breakup_date, current_phase,
 * diagnosis_summary, situation_memo, nickname)를 1쿼리로 읽어 시스템 프롬프트에 주입.
 * 클라이언트가 보낸 userContext 는 비로그인 fallback 으로만 사용.
 *
 * days_since_breakup 은 profiles.breakup_date(DATE) 기준으로 매 호출 재계산.
 * PHASE 도 그 결과로 자동 갱신 (시간이 지나면 PHASE 1 → 2 → 3 자연스럽게 진입).
 */
async function resolveUserContext(clientContext: UserContext | undefined): Promise<UserContext> {
  // 비로그인/실패 시 fallback 으로 쓸 안전한 기본값
  const fallback: UserContext = clientContext ?? {
    breakupType: null,
    daysSinceBreakup: 0,
    currentPhase: 1,
  }

  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fallback

    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname, breakup_type, breakup_date, current_phase, days_since_breakup, diagnosis_summary, situation_memo')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) return fallback

    // breakup_date 가 있으면 정확히 재계산, 없으면 캐시값 → 클라값 순으로 fallback
    const recomputedDays = profile.breakup_date
      ? Math.max(0, Math.floor((Date.now() - new Date(profile.breakup_date).getTime()) / 86_400_000))
      : null

    const days = recomputedDays
      ?? profile.days_since_breakup
      ?? fallback.daysSinceBreakup

    return {
      breakupType: profile.breakup_type ?? fallback.breakupType,
      // PHASE 는 days 기준으로 자동 재계산 (진단 시점 phase 는 초기값일 뿐)
      currentPhase: phaseFromDays(days),
      daysSinceBreakup: days,
      userName: profile.nickname ?? fallback.userName,
      gender: fallback.gender,
      partnerGender: fallback.partnerGender,
      situation: profile.diagnosis_summary ?? fallback.situation,
      situationMemo: profile.situation_memo ?? undefined,
    }
  } catch (err) {
    console.error('[chat] resolveUserContext failed, using client fallback:', err)
    return fallback
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, userContext: clientContext, image }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      userContext?: UserContext
      image?: { mimeType: string; data: string }
    } = body

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      console.error('[CRITICAL] GOOGLE_AI_API_KEY is not set in Vercel environment variables.')
      return new Response(
        JSON.stringify({
          error: 'CONFIG_ERROR',
          detail: '서비스 설정 중입니다. 잠시 후 다시 시도해 주세요. (관리자: Vercel 환경변수 GOOGLE_AI_API_KEY 확인 필요)',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 서버 컨텍스트 머지: 로그인 사용자는 profiles 우선, 비로그인은 클라 값 그대로
    const userContext = await resolveUserContext(clientContext)
    const systemPrompt = buildSystemPrompt(userContext)

    const contents: GeminiMessage[] = messages.map((m, idx) => {
      const isLastUserMessage = idx === messages.length - 1 && m.role === 'user'
      const parts: GeminiMessage['parts'] = [{ text: m.content || '(내용 없음)' }]
      if (isLastUserMessage && image) {
        parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } })
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      }
    })

    // streamGenerateContent 사용 (alt=sse 파라미터로 SSE 형식 수신)
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.75,
          topP: 0.9,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Unknown API Error'
      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || JSON.stringify(errorData)
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }

      console.error('[Gemini API Failure]:', errorMessage)

      return new Response(
        JSON.stringify({
          error: 'AI_API_ERROR',
          status: response.status,
          detail: errorMessage,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // SSE 형식(data: {...}) 파싱 — 안정적이고 정확함
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close()
          return
        }
        const reader = response.body.getReader()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            // 마지막 줄은 미완성일 수 있으므로 버퍼에 남김
            buffer = lines.pop() || ''

            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const jsonStr = trimmed.slice(5).trim()
              if (!jsonStr || jsonStr === '[DONE]') continue

              try {
                const json = JSON.parse(jsonStr)
                const text = json?.candidates?.[0]?.content?.parts?.[0]?.text

                if (text) {
                  controller.enqueue(encoder.encode(text))
                }

                const finishReason = json?.candidates?.[0]?.finishReason
                if (finishReason === 'SAFETY') {
                  controller.enqueue(encoder.encode('\n\n(안전 정책으로 인해 일부 답변이 생략되었습니다.)'))
                }
              } catch {
                // 파싱 실패한 청크는 무시
              }
            }
          }
        } catch (err: any) {
          console.error('[Stream Read Error]:', err.message)
          controller.enqueue(encoder.encode('\n\n(연결이 중단되었습니다. 다시 시도해 주세요.)'))
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: any) {
    console.error('[Global Chat API Error]:', err)
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR', detail: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
