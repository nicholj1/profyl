export class AIParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AIParseError"
  }
}

/**
 * Attempts to extract JSON from an AI response string.
 * Handles raw JSON, markdown code fences, and garbage prefix/suffix.
 */
export function extractJSON(raw: string): unknown {
  const trimmed = raw.trim()

  // Try direct parse
  try {
    return JSON.parse(trimmed)
  } catch {
    // continue
  }

  // Strip markdown code fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch {
      // continue
    }
  }

  // Try to find first { or [ and parse from there
  const objectStart = trimmed.indexOf("{")
  const arrayStart = trimmed.indexOf("[")

  let start: number
  if (objectStart === -1 && arrayStart === -1) {
    throw new AIParseError("No JSON object or array found in AI response")
  } else if (objectStart === -1) {
    start = arrayStart
  } else if (arrayStart === -1) {
    start = objectStart
  } else {
    start = Math.min(objectStart, arrayStart)
  }

  const sub = trimmed.slice(start)

  // Find matching closing bracket
  const openChar = sub[0]
  const closeChar = openChar === "{" ? "}" : "]"
  let depth = 0
  let inString = false
  let escape = false

  for (let i = 0; i < sub.length; i++) {
    const char = sub[i]

    if (escape) {
      escape = false
      continue
    }

    if (char === "\\") {
      escape = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) continue

    if (char === openChar) depth++
    if (char === closeChar) depth--

    if (depth === 0) {
      try {
        return JSON.parse(sub.slice(0, i + 1))
      } catch {
        break
      }
    }
  }

  // Last resort: try parsing the substring as-is
  try {
    return JSON.parse(sub)
  } catch {
    throw new AIParseError("Failed to extract valid JSON from AI response")
  }
}
