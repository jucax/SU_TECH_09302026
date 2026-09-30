import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>There's nothing at this address.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a href="/" className="text-sm text-action-blue underline underline-offset-4">
            Back to home
          </a>
          <a href="/demo" className="text-sm text-action-blue underline underline-offset-4">
            See the live demo
          </a>
        </CardContent>
      </Card>
    </main>
  )
}
