import { buildSystemPrompt, type UserContext } from '@/lib/ai-system-prompt'

export const runtime = 'edge'

// Gemini 모델
const AI_MODEL = process.env.GEMMA_MODEL_ID || 'gemini-1.5-flash'

interface GeminiMessage {
  role: 'user' | 'model'
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, userContext, image }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      userContext: UserContext
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

    // ✅ streamGenerateContent 사용 (alt=sse 파라미터로 SSE 형식 수신)
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

    // ✅ SSE 형식(data: {...}) 파싱으로 교체 — 안정적이고 정확함
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
              // SSE 형식: "data: {...JSON...}"
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

    // ✅ Transfer-Encoding 헤더 제거 (Vercel Edge 환경 호환)
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
