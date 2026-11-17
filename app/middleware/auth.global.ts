const PUBLIC_ROUTES = new Set(['/login', '/confirm', '/access-denied'])

/**
 * Todo o app exige membro (ADR-0006). Este middleware cuida só da navegação;
 * a autorização de verdade está nas rotas do servidor e no RLS.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSupabaseSession()

  if (to.path === '/login' && session.value) {
    return navigateTo('/')
  }

  if (PUBLIC_ROUTES.has(to.path)) {
    return
  }

  if (!session.value) {
    return navigateTo('/login')
  }

  const { member, load } = useMember()

  if (!member.value && !(await load())) {
    return navigateTo('/access-denied')
  }
})
