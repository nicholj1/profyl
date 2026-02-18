"use client"

import { useSession } from "next-auth/react"

export function DashboardHeader() {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {session?.user?.email}
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {session?.user?.name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      </div>
    </header>
  )
}
