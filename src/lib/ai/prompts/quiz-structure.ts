import type { BrandSummary, QuizConcept } from "../validation"

export function buildQuizStructurePrompt(
  brandSummary: BrandSummary,
  concept: QuizConcept
): string {
  return `You are a quiz design expert who creates engaging quizzes that capture psychographic and behavioural data whilst delivering personalised recommendations.

<brand_summary>
${JSON.stringify(brandSummary, null, 2)}
</brand_summary>

<selected_concept>
${JSON.stringify(concept, null, 2)}
</selected_concept>

Generate a complete quiz with:

1. An engaging introduction text (2-3 sentences, British English, friendly tone). This is shown to the quiz taker before they begin. It should mention they'll receive a personalised recommendation.

2. 7-10 questions, each with exactly 4 answer options. Generate one question per data dimension listed in the concept (${concept.data_dimensions.join(", ")}), plus optional extra questions if needed to reach 7 minimum.

3. Each question must include:
   - "data_dimension": which data category this question maps to (from the concept's data_dimensions list)
   - "insight": a short explanation of what psychographic/behavioural data this question captures about the respondent (for the brand's internal use only, NOT shown to quiz takers). E.g. "Indicates fitness level, daily routine structure, and potential health consciousness"

4. Question design guidelines:
   - Questions should feel fun and conversational, never clinical or survey-like.
   - Avoid direct demographic questions (age, income, location).
   - Each question should help differentiate between the possible recommendations: ${concept.result_type_names.join(", ")}.
   - Answer options should represent distinct lifestyle choices or preferences that naturally map to different recommendations.
   - Questions should capture preferences, behaviours, and values NON-DIRECTLY — e.g. "How do you usually kick off your morning?" instead of "How often do you exercise?"
   - All questions should be single_choice type.

Return a JSON object with exactly this structure:
{
  "title": "${concept.title}",
  "intro_text": "engaging 2-3 sentence introduction mentioning they'll get a personalised recommendation",
  "questions": [
    {
      "text": "question text here",
      "question_type": "single_choice",
      "data_dimension": "lifestyle preferences",
      "insight": "Indicates fitness level, routine structure, and health consciousness",
      "options": [
        { "text": "option A text" },
        { "text": "option B text" },
        { "text": "option C text" },
        { "text": "option D text" }
      ]
    }
  ]
}

Important:
- 7-10 questions (one per data dimension, plus extras if needed).
- Exactly 4 options per question.
- British English throughout.
- No duplicate or near-duplicate questions.
- Every question must have a data_dimension and insight field.

Return ONLY the JSON object, no other text or explanation.`
}
