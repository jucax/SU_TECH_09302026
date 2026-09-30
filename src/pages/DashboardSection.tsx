import { useSearchParams } from 'react-router-dom'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Tabs in the sidebar whose full screens are not built yet. Labeled as planned
// inside the shared shell instead of pretending to be finished.
export function DashboardSection({ title, summary }: { title: string; summary: string }) {
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? sessionStorage.getItem('onebridge:lastTenantSlug')

  return (
    <DashboardLayout slug={slug}>
      <Card className="max-w-lg">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wide text-review">Planned</p>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={slug ? `/dashboard?slug=${encodeURIComponent(slug)}` : '/dashboard'}
            className="text-sm font-semibold text-action-blue underline underline-offset-4"
          >
            Back to dashboard
          </a>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
