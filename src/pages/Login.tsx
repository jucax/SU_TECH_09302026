import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabaseClient'
import { WorkflowFrame } from '@/components/WorkflowFrame'

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

      const myTenantRes = await fetch('/api/tenant', {
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
    <WorkflowFrame title="Welcome back, Jorge." description="Your business information is ready when you are. Sign in to keep your website and AI connection current.">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="ob-workflow-kicker"><ShieldCheck size={15} /> BUSINESS OWNER ACCESS</p>
          <CardTitle>Log in to OneBridge</CardTitle>
          <CardDescription>Access your OneBridge dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <label className="ob-auth-field"><span><Mail size={15} />Email address</span>
            <input
              id="login-email"
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
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ob-auth-input"
            />
            </label>
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <Button type="submit" disabled={submitting} className="ob-auth-submit">
              {submitting ? <><LoaderCircle size={17} className="motion-safe:animate-spin" /> Signing in...</> : <>Log in <ArrowRight size={17} /></>}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-navy/60">
            Need an account?{' '}
            <Link to="/register" className="text-action-blue underline underline-offset-4">
              Set up your business
            </Link>
          </p>
        </CardContent>
      </Card>
    </WorkflowFrame>
  )
}
