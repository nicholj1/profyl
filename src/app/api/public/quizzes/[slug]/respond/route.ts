import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { quizzes, responses, responseAnswers } from "@/db/schema"
import { calculateResult } from "@/lib/scoring/calculate"
import { createHash } from "crypto"

const respondSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        option_id: z.string().uuid(),
      })
    )
    .min(1),
  email: z.string().email().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.slug, params.slug),
    })

    if (!quiz || quiz.status !== "live") {
      return NextResponse.json(
        { error: "Quiz not found or not live" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const result = respondSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { answers, email } = result.data

    // Calculate result using scoring engine
    const selectedOptionIds = answers.map((a) => a.option_id)
    const scoreResult = await calculateResult(quiz.id, selectedOptionIds)

    if (!scoreResult) {
      return NextResponse.json(
        { error: "Unable to calculate result" },
        { status: 500 }
      )
    }

    // Hash IP for GDPR compliance (no raw IP storage)
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || "unknown"
    const ipHash = createHash("sha256")
      .update(ip + process.env.NEXTAUTH_SECRET)
      .digest("hex")
      .slice(0, 16)

    // Create response record
    const [response] = await db
      .insert(responses)
      .values({
        quizId: quiz.id,
        resultTypeId: scoreResult.resultTypeId,
        respondentEmail: email || null,
        ipHash,
        completedAt: new Date(),
      })
      .returning()

    // Create response answers
    for (const answer of answers) {
      await db.insert(responseAnswers).values({
        responseId: response.id,
        questionId: answer.question_id,
        answerOptionId: answer.option_id,
      })
    }

    return NextResponse.json({
      result: {
        response_id: response.id,
        result_type: {
          name: scoreResult.name,
          description: scoreResult.description,
          recommendation_detail: scoreResult.recommendationDetail,
          colour: scoreResult.colour,
        },
      },
    })
  } catch (error) {
    console.error("Quiz respond error:", error)
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    )
  }
}
