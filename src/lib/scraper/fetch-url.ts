import * as cheerio from "cheerio"

interface ExtractedContent {
  title: string
  description: string
  headings: string[]
  bodyText: string
  fullText: string
}

export async function fetchAndExtractUrl(
  url: string
): Promise<ExtractedContent> {
  // Normalise URL
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Profyl/1.0; +https://profyl.app)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  return extractContent(html)
}

function extractContent(html: string): ExtractedContent {
  const $ = cheerio.load(html)

  // Remove scripts, styles, nav, footer, etc.
  $("script, style, nav, footer, header, noscript, iframe, svg").remove()

  // Extract meta information
  const title =
    $("title").text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    ""

  const description =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    ""

  // Extract headings
  const headings: string[] = []
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) {
      headings.push(text)
    }
  })

  // Extract body text from paragraphs and list items
  const bodyParts: string[] = []
  $("p, li, td, blockquote").each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length > 20 && text.length < 2000) {
      bodyParts.push(text)
    }
  })

  const bodyText = bodyParts.join("\n\n")

  // Compile full text (truncated to ~16,000 chars / ~4,000 tokens)
  const maxChars = 16000
  const parts = [
    title && `Title: ${title}`,
    description && `Description: ${description}`,
    headings.length > 0 && `Headings:\n${headings.slice(0, 20).join("\n")}`,
    bodyText && `Content:\n${bodyText}`,
  ].filter(Boolean) as string[]

  let fullText = parts.join("\n\n")
  if (fullText.length > maxChars) {
    fullText = fullText.slice(0, maxChars) + "\n\n[Content truncated]"
  }

  return {
    title,
    description,
    headings: headings.slice(0, 20),
    bodyText: bodyText.slice(0, 12000),
    fullText,
  }
}
