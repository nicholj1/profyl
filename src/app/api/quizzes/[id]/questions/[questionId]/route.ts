import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { quizzes, questions, answerOptions } from "@/db/schema"
import { requireAuth } from "@/lib/session"

const updateOptionSchema = z.object({
  option_id: z.string().uuid(),
  text: z.string().min(1).max(200),
})

const updateQuestionWithOptionsSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  options: z.array(updateOptionSchema).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
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

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, params.questionId),
    })

    if (!question || question.quizId !== params.id) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = updateQuestionWithOptionsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    // Update question text
    if (result.data.text !== undefined) {
      await db
        .update(questions)
        .set({ text: result.data.text, updatedAt: new Date() })
        .where(eq(questions.id, params.questionId))
    }

    // Update options
    if (result.data.options) {
      for (const opt of result.data.options) {
        await db
          .update(answerOptions)
          .set({ text: opt.text })
          .where(eq(answerOptions.id, opt.option_id))
      }
    }

    // Return updated question with options
    const updated = await db.query.questions.findFirst({
      where: eq(questions.id, params.questionId),
      with: {
        answerOptions: {
          orderBy: (options, { asc }) => [asc(options.sortOrder)],
        },
      },
    })

    return NextResponse.json({ question: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    )
  }
}
