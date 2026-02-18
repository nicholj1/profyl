import { eq } from "drizzle-orm"
import { db } from "@/db"
import { quizzes } from "@/db/schema"

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title)
  if (!baseSlug) {
    // Fallback for titles with no latin characters
    return `quiz-${Date.now().toString(36)}`
  }

  // Check if slug is already taken
  const existing = await db.query.quizzes.findFirst({
    where: eq(quizzes.slug, baseSlug),
    columns: { id: true },
  })

  if (!existing) {
    return baseSlug
  }

  // Add a random suffix
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${baseSlug}-${suffix}`
}
