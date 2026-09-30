import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const JORGE_SLUG = 'jorges-auto-parts'

const judgeLinks = [
  {
    label: "Jorge's website",
    description: 'The front door for people, generated from his verified data.',
    href: `/site/${JORGE_SLUG}`,
  },
  {
    label: 'llms.txt',
    description: 'States the verified facts and points to the MCP endpoint below.',
    href: `/site/${JORGE_SLUG}/llms.txt`,
  },
  {
    label: 'MCP endpoint',
    description: 'The front door for AI. Connect it from Claude Desktop or MCP Inspector.',
    href: `/site/${JORGE_SLUG}/mcp`,
  },
  {
    label: 'Connected AI accuracy check',
    description: 'Same question, same model, same settings. One side has this MCP server, one does not.',
    href: '/dashboard/monitoring',
  },
  {
    label: 'Source on GitHub',
    description: 'Full history, README with setup and status, and this build plan.',
    href: 'https://github.com/jucax/SU_TECH_09302026',
  },
]

const proofPoints = [
  {
    title: 'Current business facts',
    body: "Prices, stock, and policies come from the business owner's own verified record, not a scrape.",
  },
  {
    title: 'Answer checking',
    body: 'A controlled comparison checks whether a connected AI answer matches that verified record, field by field.',
  },
  {
    title: 'Owner control',
    body: 'Routine edits sync automatically. Larger changes, like a new product, wait for the owner to approve them.',
  },
]

export function Landing() {
  const navigate = useNavigate()
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleSeeItWork() {
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch('/api/demo-start', { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to start demo')
      const { slug } = (await res.json()) as { slug: string }
      navigate(`/dashboard?slug=${encodeURIComponent(slug)}`)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Something went wrong')
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray">
      <header className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-6">
        <img src="/brand/logo-primary.png" alt="OneBridge" className="h-9 w-auto object-contain" />
        <nav className="flex items-center gap-4 text-sm font-semibold text-navy">
          <a href="/login" className="hover:text-action-blue">
            Log in
          </a>
          <Button asChild size="sm" variant="secondary">
            <a href="/register">Set up your business</a>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-[1120px] px-6">
        <section className="grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col gap-5 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
              One trusted foundation. Two connected front doors.
            </h1>
            <p className="text-base text-secondary">
              Manage approved business information once, then use it for your website and a
              connection compatible AI assistants can access. Jorge runs a local auto parts store;
              OneBridge keeps his prices, stock, and policies accurate everywhere they're used.
            </p>
            <div className="flex flex-col items-center gap-2 lg:items-start">
              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <Button variant="primary" size="lg" onClick={handleSeeItWork} disabled={starting}>
                  {starting ? 'Setting up your sandbox...' : "See it work: Jorge's Auto Parts"}
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <a href="/register">Set up your business</a>
                </Button>
              </div>
              {startError && <p className="text-sm text-error">{startError}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-border bg-white p-5 shadow-card">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary">
                Website for people &middot; Demo example
              </p>
              <div className="rounded-lg border border-border bg-gray p-4">
                <p className="font-bold text-navy">Jorge's Auto Parts</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-navy">Front Brake Rotor</span>
                  <span className="font-semibold text-navy">$49.99</span>
                </div>
                <p className="mt-1 text-xs text-secondary">2015-2020 Honda Civic &middot; In stock</p>
              </div>
            </div>

            <div className="rounded-card border border-border bg-navy p-5 shadow-card">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">
                MCP for AI assistants &middot; Demo example
              </p>
              <pre className="overflow-x-auto rounded-lg bg-white/5 p-4 text-xs leading-relaxed text-white/90">
{`{
  "name": "Front Brake Rotor",
  "price": "$49.99",
  "available": true,
  "compatibility": "2015-2020 Honda Civic"
}`}
              </pre>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 border-t border-border py-10 sm:grid-cols-3">
          {proofPoints.map((point) => (
            <div key={point.title}>
              <p className="font-bold text-navy">{point.title}</p>
              <p className="mt-1 text-sm text-secondary">{point.body}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-border py-10">
          <Card>
            <CardHeader>
              <CardTitle>For judges</CardTitle>
              <CardDescription>
                Direct links into the live prototype, for reviewing without a walkthrough.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {judgeLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="font-semibold text-action-blue underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                    <p className="text-sm text-secondary">{link.description}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-2 px-6 text-center text-sm text-secondary sm:flex-row sm:justify-between sm:text-left">
          <p>OneBridge: The Trusted Connection. A working prototype, not a finished product.</p>
          <a
            href="https://github.com/jucax/SU_TECH_09302026"
            className="text-action-blue underline-offset-4 hover:underline"
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
