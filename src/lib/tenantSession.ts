import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Which business the dashboard is showing. ?slug= wins and is remembered for
// the tab's session, so moving between dashboard tabs keeps the same business
// even when a link drops the query string.
const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

export function rememberTenant(slug: string): void {
  sessionStorage.setItem(LAST_TENANT_KEY, slug)
}

export function forgetTenant(): void {
  sessionStorage.removeItem(LAST_TENANT_KEY)
}

export function useTenantSlug(): string | null {
  const [searchParams] = useSearchParams()
  const fromQuery = searchParams.get('slug')
  const slug = fromQuery ?? sessionStorage.getItem(LAST_TENANT_KEY)

  useEffect(() => {
    if (fromQuery) rememberTenant(fromQuery)
  }, [fromQuery])

  return slug
}
