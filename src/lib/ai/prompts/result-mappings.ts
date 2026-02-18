import type { GeneratedQuiz } from "../validation"

export function buildResultMappingsPrompt(
  quiz: GeneratedQuiz,
  resultTypeNames: string[]
): string {
  return `You are a psychometric quiz designer. Given the following quiz structure and result type names, produce:
1. Full descriptions for each result type (2-3 sentences each, British English, positive and affirming tone)
2. A scoring matrix that maps each answer option to the result types it indicates

<quiz_structure>
${JSON.stringify(quiz, null, 2)}
</quiz_structure>

<result_type_names>
${JSON.stringify(resultTypeNames)}
</result_type_names>

For the scoring matrix:
- Each answer option should map to 1-3 result types.
- Use weights: 3 (strong indicator), 2 (moderate indicator), 1 (weak indicator).
- Ensure every result type has a roughly balanced number of answer options pointing to it (at least 5 mappings each).
- Ensure every answer option maps to at least one result type.
- The mappings should make logical sense - an answer about being adventurous should map to adventurous result types, etc.

Return a JSON object with exactly this structure:
{
  "result_types": [
    {
      "name": "Result Type Name",
      "description": "2-3 sentence description, positive and affirming"
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
- Every result type must have at least 5 mappings.
- Use British English throughout.

Return ONLY the JSON object, no other text or explanation.`
}
