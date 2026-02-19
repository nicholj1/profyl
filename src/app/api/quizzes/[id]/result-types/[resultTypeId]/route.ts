import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { quizzes, resultTypes } from "@/db/schema"
import { requireAuth } from "@/lib/session"

const updateResultTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  recommendation_detail: z.string().max(1000).optional(),
  colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex colour")
    .optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; resultTypeId: string } }
) {
  try {
    const user = await requireAuth()

    // Verify ownership
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, params.id),
      with: { workspace: true },
    })

    if (!quiz || quiz.workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const resultType = await db.query.resultTypes.findFirst({
      where: eq(resultTypes.id, params.resultTypeId),
    })

    if (!resultType || resultType.quizId !== params.id) {
      return NextResponse.json(
        { error: "Result type not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = updateResultTypeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (result.data.name !== undefined) updates.name = result.data.name
    if (result.data.description !== undefined)
      updates.description = result.data.description
    if (result.data.recommendation_detail !== undefined)
      updates.recommendationDetail = result.data.recommendation_detail
    if (result.data.colour !== undefined) updates.colour = result.data.colour

    const [updated] = await db
      .update(resultTypes)
      .set(updates)
      .where(eq(resultTypes.id, params.resultTypeId))
      .returning()

    return NextResponse.json({ result_type: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to update result type" },
      { status: 500 }
    )
  }
}
