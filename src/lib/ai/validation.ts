import { z } from "zod"

// ============================================
// BRAND SUMMARY SCHEMA
// ============================================

export const brandSummarySchema = z.object({
  brand_name: z.string().min(1),
  industry: z.string().min(1),
  target_audience: z.string().min(1),
  tone: z.string().min(1),
  key_themes: z.array(z.string()).min(3).max(5),
  summary: z.string().min(20),
})

export type BrandSummary = z.infer<typeof brandSummarySchema>

// ============================================
// QUIZ CONCEPT SCHEMA
// ============================================

export const quizConceptSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1),
  outcome_framing: z.string().min(1),
  result_type_names: z.array(z.string()).min(4).max(6),
})

export const quizConceptsArraySchema = z
  .array(quizConceptSchema)
  .min(3)
  .max(5)

export type QuizConcept = z.infer<typeof quizConceptSchema>

// ============================================
// QUIZ STRUCTURE SCHEMA
// ============================================

const generatedOptionSchema = z.object({
  text: z.string().min(1),
})

const generatedQuestionSchema = z.object({
  text: z.string().min(1),
  question_type: z.enum(["single_choice", "multi_select"]),
  options: z.array(generatedOptionSchema).min(3).max(6),
})

export const generatedQuizSchema = z.object({
  title: z.string().min(1),
  intro_text: z.string().min(20),
  questions: z.array(generatedQuestionSchema).min(8).max(12),
})

export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>

// ============================================
// RESULT TYPES + MAPPING SCHEMA
// ============================================

const generatedResultTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(20),
})

const mappingEntrySchema = z.object({
  question_index: z.number().int().min(0),
  option_index: z.number().int().min(0),
  result_type_index: z.number().int().min(0),
  weight: z.number().int().min(1).max(3),
})

export const generatedResultMappingsSchema = z.object({
  result_types: z.array(generatedResultTypeSchema).min(4).max(8),
  mappings: z.array(mappingEntrySchema).min(10),
})

export type GeneratedResultMappings = z.infer<
  typeof generatedResultMappingsSchema
>

// ============================================
// BUSINESS RULE VALIDATION
// ============================================

export function validateQuizStructure(quiz: GeneratedQuiz): string | null {
  // Check question count
  if (quiz.questions.length < 8 || quiz.questions.length > 12) {
    return `Expected 8-12 questions, got ${quiz.questions.length}`
  }

  // Check each question has enough options
  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i]
    if (q.options.length < 3 || q.options.length > 6) {
      return `Question ${i + 1} has ${q.options.length} options (expected 3-6)`
    }
  }

  return null
}

export function validateResultMappings(
  mappings: GeneratedResultMappings,
  quiz: GeneratedQuiz
): string | null {
  const numQuestions = quiz.questions.length
  const numResultTypes = mappings.result_types.length

  // Check result type count
  if (numResultTypes < 4 || numResultTypes > 8) {
    return `Expected 4-8 result types, got ${numResultTypes}`
  }

  // Validate mapping indices are in bounds
  for (const mapping of mappings.mappings) {
    if (mapping.question_index >= numQuestions) {
      return `Mapping references question_index ${mapping.question_index} but only ${numQuestions} questions exist`
    }
    const question = quiz.questions[mapping.question_index]
    if (mapping.option_index >= question.options.length) {
      return `Mapping references option_index ${mapping.option_index} for question ${mapping.question_index} but only ${question.options.length} options exist`
    }
    if (mapping.result_type_index >= numResultTypes) {
      return `Mapping references result_type_index ${mapping.result_type_index} but only ${numResultTypes} result types exist`
    }
  }

  // Check each result type has at least 2 mappings
  const resultTypeCounts = new Map<number, number>()
  for (const mapping of mappings.mappings) {
    const current = resultTypeCounts.get(mapping.result_type_index) || 0
    resultTypeCounts.set(mapping.result_type_index, current + 1)
  }

  for (let i = 0; i < numResultTypes; i++) {
    const count = resultTypeCounts.get(i) || 0
    if (count < 2) {
      return `Result type "${mappings.result_types[i].name}" has only ${count} mappings (need at least 2)`
    }
  }

  return null
}
