import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { comments } = await request.json();

    if (!comments || typeof comments !== "string" || comments.trim() === "") {
      return NextResponse.json(
        { error: "Please provide comments to analyze" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = `You are a communication gap detector. Your job is NOT sentiment analysis. Find recurring confusion, uncertainty and missing clarity in customer comments. Return ONLY valid JSON, no markdown, no extra text.

IMPORTANT: Always respond in Hungarian. Use proper Hungarian spelling with accented characters (á, é, í, ó, ö, ő, ú, ü, ű).

TONE GUIDELINES - Use neutral, evidence-based language like a consultant or researcher:
GOOD examples:
- "32 kommentből 5 visszatérő kommunikációs mintázat rajzolódott ki."
- "A kommentek jelentős része ugyanazokat a kérdéseket és bizonytalanságokat tükrözi."
- "A visszajelzések alapján több kommunikációs vakfolt azonosítható."
- "A kommentek alapján a felhasználók egy része eltérően értelmezi a termék szerepét."

AVOID sensational, emotional, or marketing-style phrases such as:
- "X ember ostorozza a terméket"
- "90%-a valójában..."
- "senki nem érti"
- "mindenki azt hiszi"
- "A termék ellen támadók..."
- "Mindenki félreérti..."

The JSON structure must be:
{
  "headline": "32 kommentből 5 visszatérő kommunikációs mintázat rajzolódott ki",
  "confusionScore": 65,
  "topConfusions": [
    {
      "topic": "rövid téma megnevezés",
      "humanInsight": "közérthető magyarázat a félreértési mintáról",
      "exampleComments": ["tényleges példa a bemenetből", "másik példa"],
      "actionableAdvice": "egy konkrét teendő erre a hétre",
      "severity": "critical|moderate|minor"
    }
  ],
  "recurringQuestions": ["Kérdés 1?", "Kérdés 2?", "Kérdés 3?"],
  "blindSpots": [
    {
      "label": "rövid címke",
      "description": "milyen információ hiányzik a kommunikációdból"
    }
  ],
  "suggestedFAQ": ["FAQ elem 1", "FAQ elem 2", "FAQ elem 3", "FAQ elem 4", "FAQ elem 5"],
  "closingInsight": "egy tényszerű mondat, ami összefoglalja a fő kommunikációs lehetőséget"
}

IMPORTANT RULES:
- confusionScore is a number from 0-100 representing the percentage of comments that show confusion, uncertainty, or missing information.
- All text content MUST be in Hungarian with proper accented characters.
- Use natural Hungarian phrasing, not machine-translated text.
- Base all observations directly on the comments provided - do not exaggerate or generalize.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Elemezd ezeket az ügyfélkommenteket visszatérő félreértési minták szempontjából. A válaszodat magyar nyelven add meg, megfelelő ékezetekkel:\n\n${comments}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: "Failed to analyze comments. Please try again." },
        { status: response.status }
      );
    }

    const data = await response.json();
    let content = data.content[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Strip markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const analysis = JSON.parse(cleaned);
    return NextResponse.json(analysis);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Analysis error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
