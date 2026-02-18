import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import {
  workspaces,
  quizzes,
  questions,
  answerOptions,
  resultTypes,
  answerOptionResultMappings,
} from "@/db/schema"
import { requireAuth } from "@/lib/session"
import { generateQuizStructure, generateResultMappings } from "@/lib/ai/generate"
import { quizConceptSchema, brandSummarySchema } from "@/lib/ai/validation"
import { generateUniqueSlug } from "@/lib/utils/slug"

const createQuizSchema = z.object({
  concept: quizConceptSchema,
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
    const result = createQuizSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid concept or brand summary data" },
        { status: 400 }
      )
    }

    const { concept, brand_summary } = result.data

    // Step 1: Generate quiz structure
    const generatedQuiz = await generateQuizStructure(brand_summary, concept)

    // Step 2: Generate result types and mappings
    const generatedMappings = await generateResultMappings(
      generatedQuiz,
      concept.result_type_names
    )

    // Step 3: Save everything to database
    const slug = await generateUniqueSlug(generatedQuiz.title)

    // Create quiz
    const [quiz] = await db
      .insert(quizzes)
      .values({
        workspaceId: params.id,
        slug,
        title: generatedQuiz.title,
        description: generatedQuiz.intro_text,
        status: "draft",
        aiConcept: concept,
      })
      .returning()

    // Create questions and answer options
    const questionIds: string[] = []
    const optionIdMap: Map<string, string> = new Map() // "qIdx-oIdx" -> optionId

    for (let qIdx = 0; qIdx < generatedQuiz.questions.length; qIdx++) {
      const q = generatedQuiz.questions[qIdx]

      const [question] = await db
        .insert(questions)
        .values({
          quizId: quiz.id,
          sortOrder: qIdx,
          text: q.text,
          questionType: q.question_type,
        })
        .returning()

      questionIds.push(question.id)

      for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
        const [option] = await db
          .insert(answerOptions)
          .values({
            questionId: question.id,
            sortOrder: oIdx,
            text: q.options[oIdx].text,
          })
          .returning()

        optionIdMap.set(`${qIdx}-${oIdx}`, option.id)
      }
    }

    // Create result types
    const resultTypeIds: string[] = []
    const defaultColours = [
      "#6C5CE7",
      "#00B894",
      "#E17055",
      "#0984E3",
      "#FDCB6E",
      "#E84393",
      "#00CEC9",
      "#636E72",
    ]

    for (let i = 0; i < generatedMappings.result_types.length; i++) {
      const rt = generatedMappings.result_types[i]
      const [resultType] = await db
        .insert(resultTypes)
        .values({
          quizId: quiz.id,
          sortOrder: i,
          name: rt.name,
          description: rt.description,
          colour: defaultColours[i % defaultColours.length],
        })
        .returning()

      resultTypeIds.push(resultType.id)
    }

    // Create answer-to-result mappings
    for (const mapping of generatedMappings.mappings) {
      const optionId = optionIdMap.get(
        `${mapping.question_index}-${mapping.option_index}`
      )
      const resultTypeId = resultTypeIds[mapping.result_type_index]

      if (optionId && resultTypeId) {
        await db.insert(answerOptionResultMappings).values({
          answerOptionId: optionId,
          resultTypeId: resultTypeId,
          weight: mapping.weight,
        })
      }
    }

    return NextResponse.json(
      {
        quiz: {
          id: quiz.id,
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description,
          status: quiz.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create quiz error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to generate quiz. Please try again." },
      { status: 500 }
    )
  }
}
