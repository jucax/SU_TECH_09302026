import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Placeholder({ title, slice }: { title: string; slice: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray px-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This route is wired up. The real screen lands in {slice}.</CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/" className="text-sm text-action-blue underline underline-offset-4">
            Back to landing
          </a>
        </CardContent>
      </Card>
    </main>
  )
}
