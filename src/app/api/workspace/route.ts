import { NextResponse } from "next/server"
import { getCurrentWorkspace } from "@/lib/session"

export async function GET() {
  try {
    const workspace = await getCurrentWorkspace()

    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        websiteUrl: workspace.websiteUrl,
        brandSummary: workspace.brandSummary,
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    )
  }
}
