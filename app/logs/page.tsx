import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Daily Logs - Work Management System',
}

export default function LogsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Daily Logs</h1>
      
      <div className="bg-card border border-border rounded p-6 mb-8 shadow-sm">
        <p className="text-foreground mb-4">
          This page is used by employees to log their daily working hours for projects.
        </p>
      </div>

      <div className="bg-muted border border-border rounded p-6 mb-8">
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Actions</h2>
        <ul className="space-y-2 text-foreground">
          <li>• Log work hours</li>
          <li>• View past logs</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link href="/reports">
          <Button variant="outline">Go to Reports</Button>
        </Link>
      </div>
    </div>
  )
}
