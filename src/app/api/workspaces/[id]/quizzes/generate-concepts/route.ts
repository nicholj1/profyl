import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { workspaces } from "@/db/schema"
import { requireAuth } from "@/lib/session"
import { generateQuizConcepts } from "@/lib/ai/generate"
import { brandSummarySchema } from "@/lib/ai/validation"

const generateConceptsSchema = z.object({
  brand_summary: brandSummarySchema,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Verify workspace ownership
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, params.id),
    })

    if (!workspace || workspace.ownerId !== user.id) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
    }

    const body = await request.json()
    const result = generateConceptsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid brand summary data" },
        { status: 400 }
      )
    }

    const concepts = await generateQuizConcepts(result.data.brand_summary)

    return NextResponse.json({ concepts })
  } catch (error) {
    console.error("Generate concepts error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to generate quiz concepts. Please try again." },
      { status: 500 }
    )
  }
}
