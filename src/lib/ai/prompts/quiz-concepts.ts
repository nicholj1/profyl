import type { BrandSummary } from "../validation"

export function buildQuizConceptsPrompt(brandSummary: BrandSummary): string {
  return `You are a quiz design expert who creates engaging, personality-style quizzes for brands.

Given the following brand summary, generate exactly 4 quiz concepts. Each concept should be a fun, engaging quiz that subtly captures behavioural and psychographic data relevant to the brand's audience.

<brand_summary>
${JSON.stringify(brandSummary, null, 2)}
</brand_summary>

Each concept must include:
- A catchy, engaging quiz title (max 80 characters)
- A one-sentence description of the quiz premise
- The primary outcome framing (e.g. "Which [X] are you?", "What's your [Y] style?")
- 4-6 result type names that would be the possible outcomes

Guidelines:
- Make the quizzes feel fun and conversational, not clinical or survey-like.
- Each concept should take a different angle on the brand's audience.
- Result types should feel distinct and memorable.
- Use British English throughout.
- Concepts should be relevant to the brand's industry and audience.

Return a JSON array of exactly 4 concepts:
[
  {
    "title": "quiz title here",
    "description": "one sentence description",
    "outcome_framing": "What's your X style?",
    "result_type_names": ["Type A", "Type B", "Type C", "Type D"]
  }
]

Return ONLY the JSON array, no other text or explanation.`
}
