import { waitUntil } from '@vercel/functions'

/*
 * Na Vercel, o Nitro 2 não repassa o `event.waitUntil` para a plataforma, e a função pode ser encerrada
 * logo depois da resposta, no meio de um job (ADR-0005). O `waitUntil` da Vercel mantém a função viva
 * até o trabalho terminar. Fora da Vercel ele não faz nada, e o Nitro segue como antes.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', (event) => {
    event.context.waitUntil ??= waitUntil
  })
})
