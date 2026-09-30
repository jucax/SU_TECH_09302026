import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      const myTenantRes = await fetch('/api/my-tenant', {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      })
      const myTenantBody = await myTenantRes.json()
      if (!myTenantRes.ok) throw new Error(myTenantBody.error ?? 'Could not find your business')

      if (myTenantBody.slug) {
        sessionStorage.setItem(LAST_TENANT_KEY, myTenantBody.slug)
        navigate(`/dashboard?slug=${encodeURIComponent(myTenantBody.slug)}`)
      } else {
        navigate('/setup')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Access your OneBridge dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
            />
            {error && <p className="text-sm text-orange">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-navy/60">
            Need an account?{' '}
            <a href="/register" className="text-blue underline underline-offset-4">
              Set up your business
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
