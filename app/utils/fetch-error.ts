const GENERIC_MESSAGE = 'Não foi possível carregar. Tente de novo.'

/**
 * Mensagem para exibir a partir de um erro de `useFetch`/`$fetch`. Usa a mensagem do servidor
 * só nos erros previstos (4xx e 503); nos demais, o texto genérico.
 */
export function describeFetchError(error: unknown): string {
  const { statusCode, data } = (error ?? {}) as { statusCode?: number, data?: { message?: unknown } }
  const isExpected = statusCode !== undefined && (statusCode < 500 || statusCode === 503)

  return isExpected && typeof data?.message === 'string' ? data.message : GENERIC_MESSAGE
}
