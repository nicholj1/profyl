import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { workspaces } from "@/db/schema"
import { requireAuth } from "@/lib/session"
import { fetchAndExtractUrl } from "@/lib/scraper/fetch-url"
import { generateBrandSummary } from "@/lib/ai/generate"

const analyseUrlSchema = z.object({
  url: z.string().min(1, "URL is required"),
  description: z.string().max(500).optional(),
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
    const result = analyseUrlSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { url, description } = result.data

    // Fetch and extract website content
    let websiteText: string
    try {
      const extracted = await fetchAndExtractUrl(url)
      websiteText = extracted.fullText
    } catch {
      // If URL fetch fails, use description as fallback
      if (!description) {
        return NextResponse.json(
          {
            error:
              "We couldn't access that website. Please check the URL or add a description of your brand.",
          },
          { status: 422 }
        )
      }
      websiteText = `Brand URL: ${url}\n\nUser description: ${description}`
    }

    // Generate brand summary via AI
    const brandSummary = await generateBrandSummary(websiteText, description)

    // Store on workspace
    await db
      .update(workspaces)
      .set({
        websiteUrl: url,
        brandSummary,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, params.id))

    return NextResponse.json({ brand_summary: brandSummary })
  } catch (error) {
    console.error("Analyse URL error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to analyse URL. Please try again." },
      { status: 500 }
    )
  }
}
