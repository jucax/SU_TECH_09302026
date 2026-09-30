import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'

const LAST_TENANT_KEY = 'onebridge:lastTenantSlug'

export function Register() {
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setNeedsEmailConfirmation(false)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError

      if (!data.session) {
        // Supabase project has "Confirm email" on: signUp succeeds but there
        // is no usable session yet, so we can't create the tenant until the
        // owner confirms and logs in.
        setNeedsEmailConfirmation(true)
        return
      }

      const createRes = await fetch('/api/create-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ name: businessName }),
      })
      const createBody = await createRes.json()
      if (!createRes.ok) throw new Error(createBody.error ?? 'Could not create your business')

      sessionStorage.setItem(LAST_TENANT_KEY, createBody.slug)
      navigate(`/setup?slug=${encodeURIComponent(createBody.slug)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (needsEmailConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email}. Confirm your account, then{' '}
              <a href="/login" className="text-blue underline underline-offset-4">
                log in
              </a>{' '}
              to set up {businessName || 'your business'}.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>
            Create an account, then we'll walk you through adding your products, hours, and
            policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <input
              type="text"
              required
              placeholder="Business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
            />
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
              minLength={6}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-full border border-navy/20 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-blue"
            />
            {error && <p className="text-sm text-orange">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-navy/60">
            Already have an account?{' '}
            <a href="/login" className="text-blue underline underline-offset-4">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
