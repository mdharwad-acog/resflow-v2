import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Reports - Work Management System',
}

export default function ReportsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Reports</h1>
      
      <div className="bg-card border border-border rounded p-6 mb-8 shadow-sm">
        <p className="text-foreground mb-4">
          This page shows all submitted reports.
          Employees submit weekly reports.
          Interns submit daily reports.
          Team leads submit phase reports.
        </p>
      </div>

      <div className="bg-muted border border-border rounded p-6 mb-8">
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Actions</h2>
        <ul className="space-y-2 text-foreground">
          <li>• Submit report</li>
          <li>• View report history</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link href="/reports/1">
          <Button>View Report</Button>
        </Link>
      </div>
    </div>
  )
}
