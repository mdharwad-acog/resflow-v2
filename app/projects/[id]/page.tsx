import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Project Details - Work Management System',
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Project Details</h1>
      
      <div className="bg-card border border-border rounded p-6 mb-8 shadow-sm">
        <p className="text-foreground mb-4">
          This page shows all information about a project.
          It contains team, allocations, phases, and status.
        </p>
      </div>

      <div className="bg-muted border border-border rounded p-6 mb-8">
        <h2 className="text-lg font-serif font-semibold text-foreground mb-4">Actions</h2>
        <ul className="space-y-2 text-foreground">
          <li>• View team</li>
          <li>• View allocations</li>
          <li>• View phases</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <Link href="/projects/1/phases">
          <Button>View Phases</Button>
        </Link>
        <Link href="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    </div>
  )
}
