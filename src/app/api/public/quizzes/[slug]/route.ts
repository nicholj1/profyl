import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { quizzes, questions, resultTypes } from "@/db/schema"

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.slug, params.slug),
    })

    if (!quiz || quiz.status !== "live") {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      )
    }

    // Fetch questions with options (no mappings - those are internal)
    const quizQuestions = await db.query.questions.findMany({
      where: eq(questions.quizId, quiz.id),
      columns: {
        id: true,
        sortOrder: true,
        text: true,
        questionType: true,
      },
      with: {
        answerOptions: {
          columns: {
            id: true,
            sortOrder: true,
            text: true,
          },
          orderBy: (options, { asc }) => [asc(options.sortOrder)],
        },
      },
      orderBy: (q, { asc }) => [asc(q.sortOrder)],
    })

    // Fetch result type names only (descriptions shown after completion)
    const quizResultTypes = await db.query.resultTypes.findMany({
      where: eq(resultTypes.quizId, quiz.id),
      columns: {
        id: true,
        name: true,
      },
      orderBy: (rt, { asc }) => [asc(rt.sortOrder)],
    })

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        slug: quiz.slug,
        title: quiz.title,
        description: quiz.description,
        emailCapture: quiz.emailCapture,
        questionCount: quizQuestions.length,
        resultTypeCount: quizResultTypes.length,
        questions: quizQuestions,
      },
    })
  } catch (error) {
    console.error("Public quiz fetch error:", error)
    return NextResponse.json(
      { error: "Failed to load quiz" },
      { status: 500 }
    )
  }
}
