import { auth } from "@/lib/auth"
import { db } from "@/db"
import { workspaces } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }
  return session.user
}

export async function getCurrentWorkspace() {
  const user = await getCurrentUser()
  if (!user) {
    return null
  }

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, user.id),
  })

  return workspace
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireWorkspace() {
  const workspace = await getCurrentWorkspace()
  if (!workspace) {
    throw new Error("No workspace found")
  }
  return workspace
}
