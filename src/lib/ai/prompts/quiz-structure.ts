import type { BrandSummary, QuizConcept } from "../validation"

export function buildQuizStructurePrompt(
  brandSummary: BrandSummary,
  concept: QuizConcept
): string {
  return `You are a quiz design expert. Generate a complete quiz structure based on the selected concept and brand context.

<brand_summary>
${JSON.stringify(brandSummary, null, 2)}
</brand_summary>

<selected_concept>
${JSON.stringify(concept, null, 2)}
</selected_concept>

Generate a complete quiz with:
1. An engaging introduction text (2-3 sentences, British English, friendly tone). This is shown to the quiz taker before they begin.
2. Exactly 10 questions, each with exactly 4 answer options.
3. Questions should be a mix of:
   - Behavioural preferences (how they act, what they choose)
   - Lifestyle indicators (daily routines, hobbies, social habits)
   - Personality traits (decision-making style, values, attitudes)
4. Questions should feel fun and conversational, never clinical or intrusive.
5. Avoid direct demographic questions (age, income, location).
6. Each question should help differentiate between the result types: ${concept.result_type_names.join(", ")}.
7. All questions should be single_choice type.

Return a JSON object with exactly this structure:
{
  "title": "${concept.title}",
  "intro_text": "engaging 2-3 sentence introduction",
  "questions": [
    {
      "text": "question text here",
      "question_type": "single_choice",
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
- Exactly 10 questions.
- Exactly 4 options per question.
- British English throughout.
- No duplicate or near-duplicate questions.

Return ONLY the JSON object, no other text or explanation.`
}
