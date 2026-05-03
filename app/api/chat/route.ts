import { buildSystemPrompt, type UserContext } from '@/lib/ai-system-prompt'

export const runtime = 'edge'

const AI_MODEL = 'gemini-3.1-flash-lite-preview'

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
      console.error('[CRITICAL] GOOGLE_AI_API_KEY is missing in environment variables.')
      return new Response(JSON.stringify({ error: 'CONFIG_ERROR', detail: 'API 키가 설정되지 않았습니다.' }), { status: 500 })
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

    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${AI_MODEL}:streamGenerateContent?key=${apiKey}`
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        system_instruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.7,
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
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      console.error('[Gemini API Failure]:', errorMessage)
      
      return new Response(JSON.stringify({ 
        error: 'AI_API_ERROR', 
        status: response.status,
        detail: errorMessage
      }), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) return
        const reader = response.body.getReader()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            buffer += decoder.decode(value, { stream: true })
            
            let startIndex
            while ((startIndex = buffer.indexOf('{')) !== -1) {
              let depth = 0
              let endIndex = -1
              
              for (let i = startIndex; i < buffer.length; i++) {
                if (buffer[i] === '{') depth++
                else if (buffer[i] === '}') depth--
                if (depth === 0) {
                  endIndex = i
                  break
                }
              }
              
              if (endIndex === -1) break 

              const jsonStr = buffer.substring(startIndex, endIndex + 1)
              try {
                const json = JSON.parse(jsonStr)
                const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || 
                             json?.candidates?.[0]?.parts?.[0]?.text
                
                if (text) {
                  controller.enqueue(encoder.encode(text))
                }
                
                if (json?.candidates?.[0]?.finishReason === 'SAFETY') {
                  controller.enqueue(encoder.encode('\n\n(안전 정책으로 인해 답변이 중단되었습니다.)'))
                }
              } catch (e) {
                // Ignore parsing errors for partial chunks
              }
              buffer = buffer.substring(endIndex + 1)
            }
          }
        } catch (err: any) {
          console.error('[Stream Error]:', err.message)
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (err: any) {
    console.error('[Global Chat API Error]:', err)
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', detail: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
