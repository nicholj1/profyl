import { NextRequest, NextResponse } from "next/server"
import { eq, and, isNotNull } from "drizzle-orm"
import { db } from "@/db"
import { quizzes, responses } from "@/db/schema"
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

    // Fetch all completed responses with result types
    const responseList = await db.query.responses.findMany({
      where: and(
        eq(responses.quizId, params.id),
        isNotNull(responses.completedAt)
      ),
      with: {
        resultType: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: (r, { desc }) => [desc(r.completedAt)],
    })

    // Build CSV
    const headers = ["Response ID", "Email", "Result Type", "Completed At"]
    const rows = responseList.map((r) => [
      r.id,
      r.respondentEmail || "",
      r.resultType?.name || "Unknown",
      r.completedAt
        ? new Date(r.completedAt).toISOString()
        : "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape CSV values with quotes if they contain commas or quotes
            const str = String(cell)
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          })
          .join(",")
      ),
    ].join("\n")

    const filename = `${quiz.slug}-responses-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to export responses" },
      { status: 500 }
    )
  }
}
