import { useState } from 'react'
import { ArrowRight, Building2, LockKeyhole, Mail, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { WorkflowFrame } from '@/components/WorkflowFrame'

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

      const createRes = await fetch('/api/tenant', {
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
      <WorkflowFrame title="One trusted start for your business." description="Create your account, confirm your email, then build from the business information you already have.">
        <Card className="max-w-md">
          <CardHeader>
            <p className="ob-workflow-kicker"><CheckCircle2 size={15} /> ONE MORE STEP</p>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to {email}. Confirm your account, then{' '}
              <Link to="/login" className="text-action-blue underline underline-offset-4">
                log in
              </Link>{' '}
              to set up {businessName || 'your business'}.
            </CardDescription>
          </CardHeader>
        </Card>
      </WorkflowFrame>
    )
  }

  return (
    <WorkflowFrame title="Bring your business into better view." description="Create your account, then add the products, hours, and policies your customers and compatible AI assistants need.">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="ob-workflow-kicker"><Building2 size={15} /> START WITH WHAT YOU HAVE</p>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>
            Create an account, then we'll walk you through adding your products, hours, and
            policies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="ob-auth-field"><span><Building2 size={15} />Business name</span>
            <input
              id="register-business"
              type="text"
              required
              autoComplete="organization"
              placeholder="Jorge's Auto Parts"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="ob-auth-input"
            />
            </label>
            <label className="ob-auth-field"><span><Mail size={15} />Email address</span>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@yourbusiness.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ob-auth-input"
            />
            </label>
            <label className="ob-auth-field"><span><LockKeyhole size={15} />Password</span>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ob-auth-input"
            />
            </label>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <Button type="submit" disabled={submitting} className="ob-auth-submit">
              {submitting ? <><LoaderCircle size={17} className="motion-safe:animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={17} /></>}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-navy/60">
            Already have an account?{' '}
            <Link to="/login" className="text-action-blue underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </WorkflowFrame>
  )
}
