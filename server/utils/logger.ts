type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

/**
 * Logger central do servidor: uma linha JSON por evento, formato que a Vercel indexa.
 * Usuários são identificados pelo id; e-mail, tokens e chaves nunca entram no log.
 */
export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (level === 'debug' && !import.meta.dev) {
    return
  }

  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...serialize(context) })

  if (level === 'error') {
    console.error(line)
  }
  else if (level === 'warn') {
    console.warn(line)
  }
  else {
    console.info(line)
  }
}

/** `Error` não serializa em JSON por padrão; extrai os campos úteis. */
function serialize(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value,
    ]),
  )
}
