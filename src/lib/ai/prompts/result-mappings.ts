import type { BrandSummary, GeneratedQuiz } from "../validation"

export function buildResultMappingsPrompt(
  quiz: GeneratedQuiz,
  resultTypeNames: string[],
  brandSummary: BrandSummary
): string {
  return `You are a quiz design expert creating personalised recommendation results for a brand quiz.

<brand_summary>
${JSON.stringify(brandSummary, null, 2)}
</brand_summary>

<quiz_structure>
${JSON.stringify(quiz, null, 2)}
</quiz_structure>

<recommendation_names>
${JSON.stringify(resultTypeNames)}
</recommendation_names>

For each recommendation, produce:
1. A "description" — 2-3 sentences explaining WHY this recommendation is perfect for the quiz-taker, based on the pattern of answers that would lead to it. Written in second person ("You..."), positive and enthusiastic tone.
2. A "recommendation_detail" — the actual valuable output. This is the specific, actionable recommendation the quiz-taker receives. It should:
   - Reference the brand's actual products or services where possible
   - Be concrete and specific (e.g. a recipe with ingredients, a routine with steps, a product combination with usage tips)
   - Feel genuinely useful and personalised
   - Be 2-4 sentences

Also produce a scoring matrix that maps each answer option to the recommendations it indicates.

For the scoring matrix:
- Each answer option should map to 1-3 recommendations.
- Use weights: 3 (strong indicator), 2 (moderate indicator), 1 (weak indicator).
- Think about answer combinations: someone who chose an active lifestyle + fruity preferences + health-focused should strongly map to a health-oriented recommendation.
- Ensure every recommendation has a roughly balanced number of answer options pointing to it (at least 5 mappings each).
- Ensure every answer option maps to at least one recommendation.
- The mappings should make logical sense — an answer about being adventurous should map to more adventurous recommendations, etc.

Return a JSON object with exactly this structure:
{
  "result_types": [
    {
      "name": "Recommendation Name",
      "description": "2-3 sentences explaining why this is perfect for them",
      "recommendation_detail": "2-4 sentences with specific, actionable recommendation content referencing brand products"
    }
  ],
  "mappings": [
    {
      "question_index": 0,
      "option_index": 0,
      "result_type_index": 0,
      "weight": 3
    }
  ]
}

Important:
- question_index is 0-based (0 to ${quiz.questions.length - 1}).
- option_index is 0-based (0 to 3 for each question).
- result_type_index is 0-based (0 to ${resultTypeNames.length - 1}).
- weight must be 1, 2, or 3.
- Every answer option must appear at least once in the mappings.
- Every recommendation must have at least 5 mappings.
- Use British English throughout.

Return ONLY the JSON object, no other text or explanation.`
}
