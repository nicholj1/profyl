import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { quizzes, questions, resultTypes } from "@/db/schema"
import { requireAuth } from "@/lib/session"

const updateQuizSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  email_capture: z.boolean().optional(),
})

async function verifyQuizOwnership(quizId: string, userId: string) {
  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: {
      workspace: true,
    },
  })

  if (!quiz || quiz.workspace.ownerId !== userId) {
    return null
  }

  return quiz
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const quiz = await verifyQuizOwnership(params.id, user.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Fetch full quiz with questions, options, and result types
    const quizQuestions = await db.query.questions.findMany({
      where: eq(questions.quizId, quiz.id),
      with: {
        answerOptions: {
          orderBy: (options, { asc }) => [asc(options.sortOrder)],
        },
      },
      orderBy: (q, { asc }) => [asc(q.sortOrder)],
    })

    const quizResultTypes = await db.query.resultTypes.findMany({
      where: eq(resultTypes.quizId, quiz.id),
      orderBy: (rt, { asc }) => [asc(rt.sortOrder)],
    })

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        emailCapture: quiz.emailCapture,
        aiConcept: quiz.aiConcept,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        questions: quizQuestions,
        resultTypes: quizResultTypes,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const quiz = await verifyQuizOwnership(params.id, user.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = updateQuizSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (result.data.title !== undefined) updates.title = result.data.title
    if (result.data.description !== undefined)
      updates.description = result.data.description
    if (result.data.email_capture !== undefined)
      updates.emailCapture = result.data.email_capture

    const [updated] = await db
      .update(quizzes)
      .set(updates)
      .where(eq(quizzes.id, params.id))
      .returning()

    return NextResponse.json({ quiz: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const quiz = await verifyQuizOwnership(params.id, user.id)

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Archive instead of hard delete
    await db
      .update(quizzes)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(quizzes.id, params.id))

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    )
  }
}
