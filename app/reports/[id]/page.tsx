import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Report Details - Work Management System',
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Report Details</h1>
      
      <div className="bg-card border border-border rounded p-6 mb-8 shadow-sm">
        <p className="text-foreground mb-4">
          This page shows the details of a submitted report.
          It includes linked logs and project information.
        </p>
      </div>

      <div className="bg-muted border border-border rounded p-6 mb-8">
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Actions</h2>
        <ul className="space-y-2 text-foreground">
          <li>• Review report</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link href="/reports">
          <Button variant="outline">Back to Reports</Button>
        </Link>
      </div>
    </div>
  )
}
