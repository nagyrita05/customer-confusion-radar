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
      "shortLabel": "Részvételi forma",
      "fullDescription": "Nem egyértelműen kommunikált, hogy online vagy helyszíni a workshop.",
      "commentIndexes": [1, 4],
      "recommendation": "Tüntesd fel egyértelműen minden hirdetésben és a leírásban, hogy a workshop online vagy helyszíni formában zajlik."
    }
  ],
  "suggestedFAQ": ["FAQ elem 1", "FAQ elem 2", "FAQ elem 3", "FAQ elem 4", "FAQ elem 5"],
  "closingInsight": "egy tényszerű mondat, ami összefoglalja a fő kommunikációs lehetőséget"
}

IMPORTANT RULES:
- flaggedCommentIndexes is an array of the comment numbers (1-based, matching the numbering "[N]" shown before each comment in the input) that point to missing or unclear information. A comment should be flagged if it EITHER: (a) contains a question pointing to missing information, OR (b) contains a statement that reflects an interpretation, assumption, or expectation the communication did not clearly address. Only include each index once, and only include indexes that actually exist in the input. Do NOT return a percentage — return the specific flagged comment numbers so the percentage can be computed transparently.
- blindSpots are the specific pieces of information missing or unclear in the communication. Derive them ENTIRELY from the data — do NOT use a fixed or hard-coded list. Each blind spot has a "shortLabel", a "fullDescription", and "commentIndexes". A blind spot must be expressed as a MISSING-INFORMATION statement, not as a bare category.
  - shortLabel: 2–3 words, noun-based, suitable for charts and badges (e.g. "Részvételi forma", "Célcsoport", "Ár tartalma", "Formátum", "Visszanézhetőség", "Időpontok"). NEVER use long, sentence-like text here.
  - fullDescription: a complete missing-communication statement that explains what information is missing. Write it as a full Hungarian sentence (e.g. "Nem egyértelműen kommunikált, hogy online vagy helyszíni a workshop.", "Nem derül ki, milyen tudásszintű résztvevőknek szól a workshop.", "Nem világos, mit tartalmaz pontosan az ár."). Do NOT use bare category labels like "Formátum" or "Árazás" here.
  - commentIndexes lists the 1-based input numbers ("[N]") of EVERY comment that relates to this blind spot — not just one example. You MUST classify ALL comments, not pick a single representative one.
  - recommendation: EXACTLY ONE concrete, actionable Hungarian recommendation that directly answers / closes THIS blind spot. Every blind spot MUST have its own recommendation — no blind spot may be left without one, and there is a strict one-to-one mapping (one blind spot → one recommendation). The recommendation must address the specific missing information described in fullDescription, not a generic tip.

MANDATORY CLASSIFICATION PROCEDURE (do this before producing commentIndexes):
  1. First, identify the set of blind spots from the data.
  2. Then go through comments [1..N] ONE BY ONE, in order. For each comment, decide which blind spot(s) it relates to. A comment may relate to ZERO, ONE, or MULTIPLE blind spots.
  3. Only AFTER this comment-by-comment pass, aggregate the results: for each blind spot, collect every comment index that you classified as relating to it.
  4. A single comment that relates to two blind spots (e.g. price AND format) MUST be counted once under each — appearing in both commentIndexes lists.
  5. Each blind spot's commentIndexes is the COMPLETE list of all matching comments. Example: if 4 comments ask about age suitability, the "Korhatár" blind spot's commentIndexes MUST contain all 4 indexes. If 3 comments ask about technical integration, "Technikai részletek" MUST contain all 3.
  - Only reference indexes that actually exist in the input. Each index inside a single blind spot's list must be unique. Omit blind spots that have no matching comments. Order blind spots so the most frequently mentioned (largest commentIndexes list) is conceptually the highest priority.

VALIDATION (required before returning):
  - For every blind spot, the count that will be shown is exactly the length of its commentIndexes array. Re-check that each list contains ALL matching comments from your comment-by-comment pass, with no matching comment omitted and no duplicates.
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
        max_tokens: 8192,
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
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response. The model occasionally emits raw, unescaped control
    // characters (newlines/tabs) inside string values when echoing comments that
    // contain emojis, ellipses or repeated punctuation, which breaks JSON.parse.
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // Escape stray control characters that appear inside JSON string values,
      // then retry. This does not change the analysis content, only its encoding.
      const sanitized = cleaned.replace(/[\u0000-\u001F]/g, (ch: string) => {
        if (ch === "\n") return "\\n";
        if (ch === "\r") return "\\r";
        if (ch === "\t") return "\\t";
        return "";
      });
      analysis = JSON.parse(sanitized);
    }
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
