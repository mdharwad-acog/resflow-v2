import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Login - Work Management System',
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card rounded border border-border p-8 shadow-sm">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Login</h1>
          <p className="text-muted-foreground mb-8">
            This page is used to login into the company work platform using LDAP credentials.
            After login, the user is redirected to the task dashboard.
          </p>
          
          <Link href="/tasks">
            <Button className="w-full">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
