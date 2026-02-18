import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNotNull } from "drizzle-orm"
import { db } from "@/db"
import { quizzes, responses, resultTypes } from "@/db/schema"
import { requireAuth } from "@/lib/session"

export async function GET(
  _request: NextRequest,
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

    // Get response list with result type info
    const responseList = await db.query.responses.findMany({
      where: and(
        eq(responses.quizId, params.id),
        isNotNull(responses.completedAt)
      ),
      with: {
        resultType: {
          columns: {
            id: true,
            name: true,
            colour: true,
          },
        },
      },
      orderBy: (r, { desc }) => [desc(r.completedAt)],
    })

    // Get aggregate stats: count per result type
    const quizResultTypes = await db.query.resultTypes.findMany({
      where: eq(resultTypes.quizId, params.id),
      orderBy: (rt, { asc }) => [asc(rt.sortOrder)],
    })

    const resultTypeCounts = new Map<string, number>()
    for (const r of responseList) {
      if (r.resultTypeId) {
        const current = resultTypeCounts.get(r.resultTypeId) || 0
        resultTypeCounts.set(r.resultTypeId, current + 1)
      }
    }

    const breakdown = quizResultTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      colour: rt.colour,
      count: resultTypeCounts.get(rt.id) || 0,
      percentage:
        responseList.length > 0
          ? Math.round(
              ((resultTypeCounts.get(rt.id) || 0) / responseList.length) * 100
            )
          : 0,
    }))

    // Get email count
    const emailCount = responseList.filter(
      (r) => r.respondentEmail
    ).length

    return NextResponse.json({
      stats: {
        totalResponses: responseList.length,
        emailsCaptured: emailCount,
        breakdown,
      },
      responses: responseList.map((r) => ({
        id: r.id,
        email: r.respondentEmail,
        resultType: r.resultType
          ? { name: r.resultType.name, colour: r.resultType.colour }
          : null,
        completedAt: r.completedAt,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    )
  }
}
