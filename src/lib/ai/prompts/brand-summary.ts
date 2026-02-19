export function buildBrandSummaryPrompt(
  websiteText: string,
  userDescription?: string
): string {
  return `You are an expert brand analyst. Analyse the following website content and produce a concise brand summary that will be used to generate a personalised recommendation quiz for the brand's customers.

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
  "summary": "2-3 sentence summary of what the brand does and stands for",
  "products_or_services": [
    { "name": "product or service name", "description": "brief description of what it is" }
  ],
  "recommendation_domain": "what kind of personalised recommendation would be valuable for this brand's audience"
}

Guidelines for products_or_services:
- Extract 3-8 specific products, services, or offerings from the website content.
- Include the most prominent or popular ones the brand features.
- If specific products aren't listed, infer categories of offerings from the brand's positioning.
- Each entry should be a concrete, nameable thing (not a vague category).

Guidelines for recommendation_domain:
- This describes what the quiz result will be — the valuable thing a customer receives.
- It should be something personalised and tied to the brand's offerings.
- Examples: "personalised drink recipe", "custom workout plan", "tailored skincare routine", "bespoke travel itinerary", "ideal product bundle", "personalised meal plan".
- Make it specific to the brand's industry, not generic.

Important:
- Use British English throughout.
- If the website content is limited, use any available meta information and the user description to infer the brand identity.
- Be specific and concrete, not generic.

Return ONLY the JSON object, no other text or explanation.`
}
