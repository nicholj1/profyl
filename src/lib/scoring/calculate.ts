import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { answerOptionResultMappings, resultTypes } from "@/db/schema"

interface ScoreResult {
  resultTypeId: string
  name: string
  description: string
  recommendationDetail: string | null
  colour: string | null
  score: number
}

/**
 * Weighted additive scoring model.
 *
 * For each selected answer option, look up all its result-type mappings
 * and add the weight to the corresponding result type's score.
 * The result type with the highest total score wins.
 */
export async function calculateResult(
  quizId: string,
  selectedOptionIds: string[]
): Promise<ScoreResult | null> {
  if (selectedOptionIds.length === 0) return null

  // Fetch all result types for this quiz
  const quizResultTypes = await db.query.resultTypes.findMany({
    where: eq(resultTypes.quizId, quizId),
  })

  if (quizResultTypes.length === 0) return null

  // Fetch all mappings for the selected options
  const mappings = await db.query.answerOptionResultMappings.findMany({
    where: inArray(
      answerOptionResultMappings.answerOptionId,
      selectedOptionIds
    ),
  })

  // Accumulate scores per result type
  const scores = new Map<string, number>()
  for (const rt of quizResultTypes) {
    scores.set(rt.id, 0)
  }

  for (const mapping of mappings) {
    const current = scores.get(mapping.resultTypeId) || 0
    scores.set(mapping.resultTypeId, current + mapping.weight)
  }

  // Find the highest-scoring result type
  let topResultType = quizResultTypes[0]
  let topScore = scores.get(topResultType.id) || 0

  for (const rt of quizResultTypes) {
    const score = scores.get(rt.id) || 0
    if (score > topScore) {
      topScore = score
      topResultType = rt
    }
  }

  return {
    resultTypeId: topResultType.id,
    name: topResultType.name,
    description: topResultType.description,
    recommendationDetail: topResultType.recommendationDetail,
    colour: topResultType.colour,
    score: topScore,
  }
}
