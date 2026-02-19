import type { BrandSummary } from "../validation"

export function buildQuizConceptsPrompt(brandSummary: BrandSummary): string {
  return `You are a quiz design expert who creates engaging, personalised recommendation quizzes for brands. These quizzes have two goals:
1. Give the quiz-taker something genuinely valuable — a personalised recommendation tied to the brand's products or services.
2. Capture psychographic and behavioural data about the brand's customers in a fun, non-direct way.

Given the following brand summary, generate exactly 4 quiz concepts. Each concept should lead to a personalised recommendation that uses the brand's products or services.

<brand_summary>
${JSON.stringify(brandSummary, null, 2)}
</brand_summary>

Each concept must include:
- A catchy, engaging quiz title (max 80 characters). Frame it as discovering or matching something, e.g. "Discover Your Perfect [X]!", "Find Your Ideal [Y] Match".
- A one-sentence description of what the quiz-taker will receive (the valuable output).
- The recommendation type — what kind of personalised recommendation the quiz delivers (e.g. "personalised drink recipe", "custom product bundle", "tailored routine").
- 4-6 result type names — these are the SPECIFIC recommendations, not personality labels. They should be tied to the brand's actual products or services. For example, for a drinks brand: "Berry Protein Smoothie", "Spiced Chai Latte", "Mint Cucumber Infused Water".
- 5-7 data dimensions — the categories of psychographic/behavioural data the quiz will capture through its questions (e.g. "lifestyle preferences", "taste preferences", "social behaviour", "health & wellness", "shopping behaviour", "event preferences", "media consumption").

Guidelines:
- Result type names must be SPECIFIC recommendations (product names, recipe names, service packages), NOT personality archetypes like "The Adventurer" or "The Minimalist".
- Each concept should take a different angle on the brand's audience and offerings.
- Recommendations should reference or incorporate the brand's actual products or services.
- Make the quizzes feel fun and conversational, not clinical or survey-like.
- Data dimensions should cover a mix of lifestyle, preferences, social, health/wellness, and shopping behaviours.
- Use British English throughout.

Return a JSON array of exactly 4 concepts:
[
  {
    "title": "Discover Your Perfect [X]!",
    "description": "one sentence about what the quiz-taker receives",
    "recommendation_type": "personalised [thing] recommendation",
    "result_type_names": ["Specific Recommendation A", "Specific Recommendation B", "Specific Recommendation C", "Specific Recommendation D"],
    "data_dimensions": ["lifestyle preferences", "taste preferences", "social behaviour", "health & wellness", "shopping behaviour"]
  }
]

Return ONLY the JSON array, no other text or explanation.`
}
