import type { z } from 'zod'

/*
 * Contrato dos provedores de IA (ADR-0004). Services dependem desta interface, nunca da API
 * de um provedor: trocar de provedor é escrever outro adapter.
 */

/** Etapas com saída estruturada. Cada provedor escolhe pela configuração o modelo de cada etapa. */
export type StructureStage = 'mapping'

/** Prompt pronto para envio. A versão acompanha o resultado gerado (ADR-0003). */
export interface AiPrompt {
  version: string
  system: string
  input: string
}

export interface StructureRequest<T> {
  stage: StructureStage
  prompt: AiPrompt
  schema: z.ZodType<T>
}

/** Tokens de uma chamada. O que o modelo gasta pensando conta como saída. */
export type AiUsage = {
  inputTokens: number
  outputTokens: number
}

/** Consumo de uma etapa, gravado no job (ADR-0005). */
export type StageUsage = AiUsage & {
  model: string
  promptVersion: string
}

/**
 * Resposta fora do schema não é falha de infraestrutura: quem chama registra a falha
 * e não grava nada parcial. `model` é o modelo que respondeu.
 */
export type StructureResult<T>
  = | { success: true, data: T, model: string, usage: AiUsage }
    | { success: false, error: unknown, model: string, usage: AiUsage }

export interface AiProvider {
  structure: <T>(request: StructureRequest<T>) => Promise<StructureResult<T>>
}

/** O provedor não respondeu (rede, cota, fora do ar, configuração). Vale tentar de novo depois. */
export class AiUnavailableError extends Error {
  constructor(message: string, options?: { cause: unknown }) {
    super(message, options)
    this.name = 'AiUnavailableError'
  }
}
