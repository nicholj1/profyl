import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { quizzes, questions, resultTypes } from "@/db/schema"
import { requireAuth } from "@/lib/session"

const publishSchema = z.object({
  status: z.enum(["live", "draft"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json()
    const result = publishSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // If publishing, validate quiz is complete
    if (result.data.status === "live") {
      const questionCount = await db.query.questions.findMany({
        where: eq(questions.quizId, params.id),
        columns: { id: true },
      })

      if (questionCount.length < 7) {
        return NextResponse.json(
          { error: "Quiz must have at least 7 questions to publish" },
          { status: 422 }
        )
      }

      const resultTypeCount = await db.query.resultTypes.findMany({
        where: eq(resultTypes.quizId, params.id),
        columns: { id: true },
      })

      if (resultTypeCount.length < 4) {
        return NextResponse.json(
          { error: "Quiz must have at least 4 result types to publish" },
          { status: 422 }
        )
      }
    }

    const [updated] = await db
      .update(quizzes)
      .set({
        status: result.data.status,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, params.id))
      .returning()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    return NextResponse.json({
      quiz: {
        ...updated,
        public_url: `${appUrl}/q/${updated.slug}`,
        embed_code: `<iframe src="${appUrl}/q/${updated.slug}/embed" width="100%" height="700" frameborder="0" style="border:none;max-width:640px;margin:0 auto;display:block;"></iframe>`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to update quiz status" },
      { status: 500 }
    )
  }
}
