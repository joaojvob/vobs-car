/** Registra no logger central os erros não tratados (5xx). Erros 4xx são respostas esperadas. */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500

    if (statusCode < 500) {
      return
    }

    logger.error('Erro não tratado', { error, statusCode, path: event?.path })
  })
})
