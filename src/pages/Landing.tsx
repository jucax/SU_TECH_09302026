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
    label: 'AI visibility monitor',
    description: 'Same question, with and without the MCP connection, side by side.',
    href: '/dashboard/monitoring',
  },
  {
    label: 'Source on GitHub',
    description: 'Full history, README with setup and status, and this build plan.',
    href: 'https://github.com/jucax/SU_TECH_09302026',
  },
]

export function Landing() {
  return (
    <main className="min-h-screen bg-gray px-4 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <img
          src="/brand/logo-primary.png"
          alt="OneBridge: The Trusted Connection"
          className="w-full max-w-sm"
        />

        <p className="max-w-xl text-lg text-navy">
          One business. One trusted information foundation. Two connected digital front doors:
          a website for people, and an MCP server for AI.
        </p>

        <p className="max-w-xl text-sm text-navy/70">
          Jorge runs a local auto parts store. He knows his prices, his stock, and his policies.
          OneBridge gives him a single place to keep that information accurate, then powers both
          his website and the connection AI assistants use to answer questions about his shop,
          from the same verified record.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <a href="/dashboard">See it work: Jorge's Auto Parts</a>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <a href="/register">Set up your business</a>
          </Button>
        </div>

        <Card className="w-full text-left">
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
                    className="font-semibold text-blue underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                  <p className="text-sm text-navy/60">{link.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
