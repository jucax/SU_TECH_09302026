import { Button } from '@/components/ui/button'

export function Landing() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray px-4 text-center">
      <div>
        <h1 className="text-4xl font-extrabold text-navy">OneBridge</h1>
        <p className="mt-1 text-navy/70">The Trusted Connection</p>
      </div>
      <p className="max-w-md text-sm text-navy/60">
        Router shell placeholder. The full landing page, CTAs, and judges strip land in slice M3.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild variant="primary" size="lg">
          <a href="/dashboard">See it work: Jorge's Auto Parts</a>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <a href="/register">Set up your business</a>
        </Button>
      </div>
    </main>
  )
}
