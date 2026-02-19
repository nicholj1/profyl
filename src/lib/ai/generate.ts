import Anthropic from "@anthropic-ai/sdk"
import { extractJSON, AIParseError } from "./extract-json"
import {
  brandSummarySchema,
  quizConceptsArraySchema,
  generatedQuizSchema,
  generatedResultMappingsSchema,
  validateQuizStructure,
  validateResultMappings,
  type BrandSummary,
  type QuizConcept,
  type GeneratedQuiz,
  type GeneratedResultMappings,
} from "./validation"
import { buildBrandSummaryPrompt } from "./prompts/brand-summary"
import { buildQuizConceptsPrompt } from "./prompts/quiz-concepts"
import { buildQuizStructurePrompt } from "./prompts/quiz-structure"
import { buildResultMappingsPrompt } from "./prompts/result-mappings"

const MAX_RETRIES = 3

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.")
  }
  return new Anthropic({ apiKey })
}

async function callClaude(
  prompt: string,
  retryContext?: string,
  maxTokens: number = 4096
): Promise<string> {
  const client = getClient()

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ]

  if (retryContext) {
    messages.push(
      { role: "assistant", content: "I apologize for the error." },
      {
        role: "user",
        content: `Your previous response had the following error: ${retryContext}. Please fix it and return valid JSON only.`,
      }
    )
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages,
  })

  const textBlock = response.content.find((block) => block.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in AI response")
  }

  return textBlock.text
}

async function generateWithRetry<T>(
  prompt: string,
  validate: (raw: unknown) => T,
  businessValidate?: (parsed: T) => string | null,
  maxTokens: number = 4096
): Promise<T> {
  let lastError: string | undefined

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const raw = await callClaude(prompt, lastError, maxTokens)
      const json = extractJSON(raw)
      const parsed = validate(json)

      if (businessValidate) {
        const businessError = businessValidate(parsed)
        if (businessError) {
          lastError = businessError
          continue
        }
      }

      return parsed
    } catch (error) {
      if (error instanceof AIParseError) {
        lastError = error.message
      } else if (error instanceof Error && error.name === "ZodError") {
        lastError = error.message
      } else if (error instanceof Error) {
        // Network or API errors - add delay
        if (attempt < MAX_RETRIES - 1) {
          const delay = Math.pow(3, attempt) * 1000 // 1s, 3s, 9s
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        lastError = error.message
      } else {
        lastError = "Unknown error occurred"
      }
    }
  }

  throw new Error(
    `AI generation failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`
  )
}

// ============================================
// PUBLIC API
// ============================================

export async function generateBrandSummary(
  websiteText: string,
  userDescription?: string
): Promise<BrandSummary> {
  const prompt = buildBrandSummaryPrompt(websiteText, userDescription)
  return generateWithRetry(prompt, (json) => brandSummarySchema.parse(json))
}

export async function generateQuizConcepts(
  brandSummary: BrandSummary
): Promise<QuizConcept[]> {
  const prompt = buildQuizConceptsPrompt(brandSummary)
  return generateWithRetry(prompt, (json) =>
    quizConceptsArraySchema.parse(json)
  )
}

export async function generateQuizStructure(
  brandSummary: BrandSummary,
  concept: QuizConcept
): Promise<GeneratedQuiz> {
  const prompt = buildQuizStructurePrompt(brandSummary, concept)
  return generateWithRetry(
    prompt,
    (json) => generatedQuizSchema.parse(json),
    (parsed) => validateQuizStructure(parsed)
  )
}

export async function generateResultMappings(
  quiz: GeneratedQuiz,
  resultTypeNames: string[],
  brandSummary: BrandSummary
): Promise<GeneratedResultMappings> {
  const prompt = buildResultMappingsPrompt(quiz, resultTypeNames, brandSummary)
  return generateWithRetry(
    prompt,
    (json) => generatedResultMappingsSchema.parse(json),
    (parsed) => validateResultMappings(parsed, quiz),
    8192
  )
}
