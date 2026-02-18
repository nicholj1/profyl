export function buildBrandSummaryPrompt(
  websiteText: string,
  userDescription?: string
): string {
  return `You are an expert brand analyst. Analyse the following website content and produce a concise brand summary.

<website_content>
${websiteText}
</website_content>

${userDescription ? `<user_description>\n${userDescription}\n</user_description>` : ""}

Produce a JSON object with exactly this structure:
{
  "brand_name": "the brand or company name",
  "industry": "the industry or sector",
  "target_audience": "who the brand primarily serves",
  "tone": "the brand's communication tone (e.g. playful, professional, warm, edgy)",
  "key_themes": ["3 to 5 key themes or values the brand emphasises"],
  "summary": "2-3 sentence summary of what the brand does and stands for"
}

Important:
- Use British English throughout.
- If the website content is limited, use any available meta information and the user description to infer the brand identity.
- Be specific and concrete, not generic.

Return ONLY the JSON object, no other text or explanation.`
}
