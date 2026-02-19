import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { users, workspaces } from "@/db/schema"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = signupSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = result.data
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user and default workspace in a transaction
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      })

    // Create default workspace
    await db.insert(workspaces).values({
      ownerId: newUser.id,
      name: `${name.trim()}'s Workspace`,
    })

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error("Signup error:", error)

    // Extract detailed error info for debugging
    const err = error as Record<string, unknown>
    const details = {
      message: err?.message || "Unknown",
      code: err?.code || "none",
      severity: err?.severity || "none",
      detail: err?.detail || "none",
      hint: err?.hint || "none",
      routine: err?.routine || "none",
      cause: err?.cause ? String(err.cause) : "none",
      name: err?.name || "none",
      errno: err?.errno || "none",
    }

    return NextResponse.json(
      { error: `Signup failed (v5): ${JSON.stringify(details)}` },
      { status: 500 }
    )
  }
}
