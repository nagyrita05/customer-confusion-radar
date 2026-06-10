import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { comments, commentList, commentCount } = await request.json();

    if (!comments || typeof comments !== "string" || comments.trim() === "") {
      return NextResponse.json(
        { error: "Please provide comments to analyze" },
        { status: 400 }
      );
    }

    // Build a numbered version of the comments so the AI can reference them by index.
    // Prefer the structured commentList if provided; otherwise fall back to splitting.
    const list: string[] = Array.isArray(commentList) && commentList.length > 0
      ? commentList
      : comments.split("\n---\n");
    const numberedComments = list
      .map((c: string, i: number) => `[${i + 1}] ${c}`)
      .join("\n");

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
  "flaggedCommentIndexes": [1, 4, 7, 12],
  "topConfusions": [
    {
      "topic": "rövid téma megnevezés",
      "humanInsight": "közérthető magyarázat a hiányzó információra utaló mintáról",
      "exampleComments": ["tényleges példa a bemenetből", "másik példa"],
      "actionableAdvice": "egy konkrét teendő erre a hétre",
      "severity": "critical|moderate|minor"
    }
  ],
  "recurringQuestionsOrConcerns": ["Kérdés vagy aggodalom 1", "Kérdés vagy aggodalom 2", "Kérdés vagy aggodalom 3"],
  "sectionType": "questions|concerns",
  "blindSpots": [
    {
      "label": "rövid címke",
      "description": "milyen információ hiányzik a kommunikációdból",
      "commentIndexes": [1, 4]
    }
  ],
  "suggestedFAQ": ["FAQ elem 1", "FAQ elem 2", "FAQ elem 3", "FAQ elem 4", "FAQ elem 5"],
  "closingInsight": "egy tényszerű mondat, ami összefoglalja a fő kommunikációs lehetőséget"
}

IMPORTANT RULES:
- flaggedCommentIndexes is an array of the comment numbers (1-based, matching the numbering "[N]" shown before each comment in the input) that point to missing or unclear information. A comment should be flagged if it EITHER: (a) contains a question pointing to missing information, OR (b) contains a statement that reflects an interpretation, assumption, or expectation the communication did not clearly address. Only include each index once, and only include indexes that actually exist in the input. Do NOT return a percentage — return the specific flagged comment numbers so the percentage can be computed transparently.
- blindSpots are the specific pieces of information missing or unclear in the communication. Derive them ENTIRELY from the data — do NOT use a fixed or hard-coded list. Each blind spot has a "label", a "description", and "commentIndexes".
  - Labels MUST be short, stable, noun-based Hungarian labels, ideally 1–3 words (e.g. "Célcsoport", "Technikai részletek", "Árazás", "Formátum", "Visszanézhetőség", "Időpontok"). NEVER use long, sentence-like labels.
  - commentIndexes lists the 1-based input numbers ("[N]") of the comments that support / reveal this blind spot. One comment CAN support multiple blind spots, so the same index may appear under more than one blind spot. Only reference indexes that are also present in flaggedCommentIndexes. Omit blind spots that have no supporting comments.
- NEVER claim that comments "contain misunderstandings" (e.g. "félreértést tartalmaz"). Questions and interpreting statements signal that information is missing or unclear in the communication, not that customers misunderstood something.
- closingInsight: NEVER make causal claims about conversion or sales (e.g. "jelentősen csökkenti a konverziót", "elveszett vásárlások"). Use cautious, hedged phrasing such as "extra kérdéseket és döntési bizonytalanságot okozhat" or "valószínűleg növeli a vásárlás előtti bizonytalanságot". Always use conditional/probabilistic wording (okozhat, növelheti, valószínűleg), never definite causal statements.
- sectionType: Analyze the comments carefully. If they contain actual questions (with question marks or question-like phrasing), use "questions". If they mainly contain opinions, concerns, worries, or objections without direct questions, use "concerns".
- recurringQuestionsOrConcerns: If sectionType is "questions", list the most common questions. If sectionType is "concerns", list the most common worries, objections, or themes.
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
            content: `Összesen ${commentCount} komment érkezett. Használd ezt a pontos számot a headline-ban és minden hivatkozásban. Az egyes kommentek elé tett [N] sorszám alapján add meg a flaggedCommentIndexes mezőt.

Elemezd ezeket az ügyfélkommenteket visszatérő, hiányzó információra utaló kérdések és kommunikációs vakfoltok szempontjából. A válaszodat magyar nyelven add meg, megfelelő ékezetekkel:\n\n${numberedComments}`,
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
