import { z } from 'zod'
import type { AiProvider, AiUsage, StructureRequest, StructureResult, StructureStage } from './provider'
import { AiUnavailableError } from './provider'

/*
 * Adapter do Google Gemini (ADR-0004) pela API REST, sem SDK.
 * Usa o `generateContent`: continua suportado e é a forma documentada de pesquisar com busca
 * nos modelos que têm busca no plano gratuito. A chave vai no cabeçalho, nunca na URL.
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const REQUEST_TIMEOUT_MS = 30_000

const responseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })).optional(),
    }).optional(),
    finishReason: z.string().optional(),
  })).optional(),
  modelVersion: z.string().optional(),
  usageMetadata: z.object({
    promptTokenCount: z.number().optional(),
    candidatesTokenCount: z.number().optional(),
    thoughtsTokenCount: z.number().optional(),
  }).optional(),
})

type GenerateContentResponse = z.infer<typeof responseSchema>

interface GenerateContentRequest {
  systemInstruction: { parts: Array<{ text: string }> }
  contents: Array<{ role: 'user', parts: Array<{ text: string }> }>
  generationConfig: { responseMimeType: 'application/json', responseJsonSchema: unknown }
}

export const geminiProvider: AiProvider = {
  async structure<T>(request: StructureRequest<T>): Promise<StructureResult<T>> {
    const model = modelFor(request.stage)
    const response = await generateContent(model, {
      systemInstruction: { parts: [{ text: request.prompt.system }] },
      contents: [{ role: 'user', parts: [{ text: request.prompt.input }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: toGeminiSchema(z.toJSONSchema(request.schema)),
      },
    })
    const answeredBy = response.modelVersion ?? model
    const usage = toUsage(response.usageMetadata)
    const candidate = response.candidates?.[0]
    const text = candidate?.content?.parts
      ?.filter(part => !part.thought)
      .map(part => part.text ?? '')
      .join('') ?? ''
    let output: unknown

    try {
      output = JSON.parse(text)
    }
    catch (error) {
      const reason = candidate?.finishReason ?? 'sem resposta'

      return { success: false, error: new Error(`O Gemini não devolveu JSON (${reason})`, { cause: error }), model: answeredBy, usage }
    }

    const parsed = request.schema.safeParse(output)

    return parsed.success
      ? { success: true, data: parsed.data, model: answeredBy, usage }
      : { success: false, error: parsed.error, model: answeredBy, usage }
  },
}

function modelFor(stage: StructureStage): string {
  return useRuntimeConfig().gemini.models[stage]
}

function toUsage(metadata: GenerateContentResponse['usageMetadata']): AiUsage {
  return {
    inputTokens: metadata?.promptTokenCount ?? 0,
    outputTokens: (metadata?.candidatesTokenCount ?? 0) + (metadata?.thoughtsTokenCount ?? 0),
  }
}

/** Erro de rede, de status ou de formato vira `AiUnavailableError`: a resposta nem chegou ao schema da etapa. */
async function generateContent(model: string, body: GenerateContentRequest): Promise<GenerateContentResponse> {
  const { apiKey } = useRuntimeConfig().gemini

  if (!apiKey) {
    throw new AiUnavailableError('Chave do Gemini não configurada (NUXT_GEMINI_API_KEY).')
  }

  let response: unknown

  try {
    response = await $fetch(`/models/${model}:generateContent`, {
      baseURL: GEMINI_BASE_URL,
      method: 'POST',
      body,
      timeout: REQUEST_TIMEOUT_MS,
      retry: 1,
      retryDelay: 1000,
      // 429 fica de fora: é cota esgotada, e repetir só gastaria mais.
      retryStatusCodes: [500, 502, 503, 504],
      headers: { 'x-goog-api-key': apiKey },
    })
  }
  catch (error) {
    throw new AiUnavailableError(`Falha ao chamar o Gemini: ${model}`, { cause: error })
  }

  const parsed = responseSchema.safeParse(response)

  if (!parsed.success) {
    throw new AiUnavailableError(`Resposta inesperada do Gemini: ${model}`, { cause: parsed.error })
  }

  return parsed.data
}

/**
 * O Gemini aceita um subconjunto do JSON Schema. O Zod gera `oneOf` para uniões discriminadas
 * e `const` para literais, que viram `anyOf` e `enum` de um valor só. Nomes de campos
 * (as chaves de `properties`) ficam como estão. A validação de verdade é o `safeParse`.
 */
function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(toGeminiSchema)
  }

  if (!isRecord(node)) {
    return node
  }

  const entries = Object.entries(node)
    .filter(([key]) => key !== '$schema')
    .map(([key, value]) => {
      if (key === 'properties' && isRecord(value)) {
        return [key, Object.fromEntries(Object.entries(value).map(([name, field]) => [name, toGeminiSchema(field)]))]
      }

      if (key === 'oneOf') {
        return ['anyOf', toGeminiSchema(value)]
      }

      return key === 'const' ? ['enum', [value]] : [key, toGeminiSchema(value)]
    })

  return Object.fromEntries(entries)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
