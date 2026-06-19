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
  "recurringQuestionsOrConcerns": ["Kérdés vagy aggodalom 1", "Kérdés vagy aggodalom 2", "Kérdés vagy aggodalom 3", "Kérdés vagy aggodalom 4", "Kérdés vagy aggodalom 5", "Kérdés vagy aggodalom 6", "Kérdés vagy aggodalom 7"],
  "sectionType": "questions|concerns",
  "blindSpots": [
    {
      "shortLabel": "Részvételi forma",
      "fullDescription": "Nem egyértelműen kommunikált, hogy online vagy helyszíni a workshop.",
      "commentIndexes": [1, 4],
      "recommendation": "Tüntesd fel egyértelműen minden hirdetésben és a leírásban, hogy a workshop online vagy helyszíni formában zajlik."
    }
  ],
  "suggestedFAQ": ["FAQ elem 1", "FAQ elem 2", "FAQ elem 3", "FAQ elem 4", "FAQ elem 5", "FAQ elem 6", "FAQ elem 7"],
  "closingInsight": "egy tényszerű mondat, ami összefoglalja a fő kommunikációs lehetőséget"
}

PATTERN SUMMARY DETERMINISM (topConfusions = the "Kommunikációs mintázatok / Félreértési minták" list, and the headline count refers to it):
  - PROCEDURE — follow strictly in this order:
    1. First build the COMPLETE topConfusions array. Aim for 5–7 pattern items whenever enough relevant comments exist to support them. Never stop early and never truncate the list.
    2. If fewer than 5 genuinely meaningful, distinct patterns exist in the data, return only as many as are truly supported (it is fine to return fewer than 5 — do NOT invent filler patterns).
    3. ONLY AFTER the array is final, COUNT its items, and write the headline using that exact count.
  - The number in the headline sentence MUST be derived from, and exactly equal to, topConfusions.length. NEVER generate the headline number independently from the actual returned list. If the headline says "N ... mintázat", then topConfusions MUST contain exactly N items — no more, no fewer.
  - Self-check before returning: re-count topConfusions and confirm the headline number matches it. If they differ, fix the headline number to match the array length.
  - Word the headline naturally for the real count (e.g. for 3 patterns: "20 kommentből 3 visszatérő kommunikációs mintázat rajzolódott ki."). If only 1 pattern, use singular phrasing.

PATTERN vs BLIND SPOT SEPARATION (keep the two sections distinct):
  - topConfusions describe recurring USER BEHAVIOR, questions, reactions, or concerns — phrase the "topic" as observed behavior/reaction (e.g. "Vásárlás előtti tisztázó kérdések ismétlődnek az előfizetéssel kapcsolatban.", "Többen adatvédelmi aggodalmat fogalmaznak meg.").
  - blindSpots describe the MISSING INFORMATION behind those reactions, using a short noun-based shortLabel (e.g. "Előfizetési modell", "Adatbiztonság és hozzáférés").
  - A pattern MAY reference the same topic area as a blind spot, but the two MUST NOT use the exact same label/wording: the pattern is worded as user behavior or reaction, the blind spot as a missing-information label.

IMPORTANT RULES:
- flaggedCommentIndexes is an array of the comment numbers (1-based, matching the numbering "[N]" shown before each comment in the input) that point to missing or unclear information. A comment should be flagged if it EITHER: (a) contains a question pointing to missing information, OR (b) contains a statement that reflects an interpretation, assumption, or expectation the communication did not clearly address. Only include each index once, and only include indexes that actually exist in the input. Do NOT return a percentage — return the specific flagged comment numbers so the percentage can be computed transparently.
- blindSpots are the specific pieces of information missing or unclear in the communication. Derive them ENTIRELY from the data — do NOT use a fixed or hard-coded list. Each blind spot has a "shortLabel", a "fullDescription", and "commentIndexes". A blind spot must be expressed as a MISSING-INFORMATION statement, not as a bare category.
  - shortLabel: 2–3 words, noun-based, suitable for charts and badges (e.g. "Részvételi forma", "Célcsoport", "Ár tartalma", "Formátum", "Visszanézhetőség", "Időpontok"). NEVER use long, sentence-like text here.
  - fullDescription: a complete missing-communication statement that explains what information is missing. Write it as a full Hungarian sentence (e.g. "Nem egyértelműen kommunikált, hogy online vagy helyszíni a workshop.", "Nem derül ki, milyen tudásszintű résztvevőknek szól a workshop.", "Nem világos, mit tartalmaz pontosan az ár."). Do NOT use bare category labels like "Formátum" or "Árazás" here.
  - commentIndexes lists the 1-based input numbers ("[N]") of EVERY comment that relates to this blind spot — not just one example. You MUST classify ALL comments, not pick a single representative one.
  - recommendation: EXACTLY ONE concrete, actionable Hungarian recommendation that directly answers / closes THIS blind spot. Every blind spot MUST have its own recommendation — no blind spot may be left without one, and there is a strict one-to-one mapping (one blind spot → one recommendation). The recommendation must address the specific missing information described in fullDescription, not a generic tip.

CATEGORY LABEL NORMALIZATION (keep categories STABLE yet flexible for any industry — do NOT hard-code a closed list):
  - Use short, clear, business-friendly Hungarian category labels.
  - PREFERRED LABELS — when a topic clearly fits one of these, you MUST use that EXACT label, character-for-character. Do NOT shorten, abbreviate, or reword it:
    Adattárolás helye | Előfizetési modell | Adatbiztonság és hozzáférés | Offline működés | Technikai követelmények | Adatmegőrzési idő | Többkamerás használat
  - Do NOT create a new category name if the topic clearly fits one of the preferred labels above. Only create a new (data-derived) category if the topic clearly falls OUTSIDE all preferred labels — this keeps the analysis flexible for comments pasted from other industries.
  - CANONICAL MAPPING — these common variants are FORBIDDEN; always replace the variant on the left with the exact preferred label on the right:
    "Tárolás helye", "Felhő vs helyi tárolás", "Adatok tárolása", "Felhőtárolás" → "Adattárolás helye"
    "Tárolási idő", "Megőrzési idő", "Mennyi ideig tárol" → "Adatmegőrzési idő"
    "Bővíthetőség", "Több kamera", "Több kamera összekötése", "Kamerák kezelése", "Skálázhatóság" → "Többkamerás használat"
    "Adatbiztonság", "Hozzáférési jogok", "Hozzáférés", "Adatvédelem", "Ki láthatja a felvételeket", "Harmadik fél hozzáférése" → "Adatbiztonság és hozzáférés"
    "Előfizetés szükségessége", "Előfizetés", "Díjazás", "Árazás" (ha előfizetésről szól) → "Előfizetési modell"
    "Internetfüggőség", "Internet nélkül", "Hálózat kiesése" → "Offline működés"
    "Technikai feltételek", "Rendszerkövetelmények", "Telepítési feltételek" → "Technikai követelmények"
  - Merge "Adatbiztonság" and "Hozzáférési jogok" into "Adatbiztonság és hozzáférés" whenever both refer to who can access data, how data is protected, or whether third parties can view the recordings.
  - The SAME underlying concern must always use the SAME shortLabel. Before finalizing, review your shortLabels and MERGE any that refer to the same user concern even if worded differently. Keep them separate only if they describe genuinely different user needs.
  - Do NOT create a separate blind spot category from a single vague emotional reaction. A vague emotional reaction (e.g. fear of continuous monitoring / being watched) may ONLY become its own blind spot if it is supported by AT LEAST 2 comments. Otherwise assign it to the closest broader category — typically "Adatbiztonság és hozzáférés" or "Offline működés" depending on the meaning.
  - The normalized shortLabel for a given concern MUST be used consistently across every output section that references it: blindSpots (Vakfoltok számokban + Kommunikációs vakfoltok), topConfusions / recurringQuestionsOrConcerns (Kommunikációs mintázatok), recommendation titles (Mit javaslunk), and suggestedFAQ. The same concern must never appear under two different labels in different sections.
  - FINAL RELABEL PASS (do this last, before returning): scan every shortLabel you produced. For each one that matches a forbidden variant in the CANONICAL MAPPING above, rewrite it to the exact preferred label. Confirm no preferred-label topic was left under a shortened or alternative name anywhere in the output.
  - Keep labels short (2–3 words), clear, and business-friendly.

SUGGESTED FAQ COMPLETENESS (suggestedFAQ = the "Javasolt FAQ" section):
  - PROCEDURE — build the FAQ AFTER blindSpots are final: create one FAQ question per important blind spot, in the same priority order as blindSpots (most-supported first).
  - If there are 7 or more important blind spots, you MUST return between 8 and 10 FAQ questions. If there are exactly 6, return 6–8. If there are fewer than 6 blind spots, return one question per blind spot. Never stop early when more important blind spots exist.
  - Each FAQ question MUST directly address EXACTLY ONE communication blind spot. Do NOT merge several different issues into one broad question — keep them separate so each important blind spot is covered.
  - The FAQ MUST include EVERY major topic from the recommendation section whenever possible. Do not omit an important recommendation category just to keep the FAQ shorter — every recommended blind spot must have a matching FAQ question.
  - If the analysis surfaces topics such as storage location (tárolás helye), access rights (hozzáférési jogok), subscription model (előfizetési modell), offline use (offline működés), technical requirements (technikai követelmények), retention period (tárolási idő), or expandability / multi-device use (bővíthetőség, több kamera összekötése, skálázhatóság, csatlakoztatott eszközök), include a dedicated FAQ question for each that appears. If technical requirements appear in the recommendations, you MUST include one customer-facing FAQ question about technical requirements. If the recommendation section covers expandability, multi-camera use, scalability, or connected devices, you MUST include one FAQ question on that topic, and you must NOT drop it.
  - Keep the questions simple, customer-facing, and ready to paste onto a product page (e.g. "Működik a kamera internet nélkül is?", "Hol tárolják a felvételeket?", "Szükséges-e előfizetés a használathoz?"). Phrase them as real customer questions, not internal notes.

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
- recurringQuestionsOrConcerns (the "Leggyakoribb kérdések" / "Visszatérő aggodalmak" section): If sectionType is "questions", list the most common questions. If sectionType is "concerns", list the most common worries, objections, or themes.
  - PROCEDURE: build this list AFTER the blind spots are final, then COUNT the items before finalizing.
  - If enough relevant blind spots exist, you MUST return between 7 and 8 concrete items. If fewer distinct, genuinely relevant blind spots exist, return one item per blind spot (do NOT invent filler).
  - HARD LIMIT: never return more than 8 items in this section.
  - The items must cover the most important RECURRING customer uncertainties found in the comments (the highest-priority blind spots first).
  - Each item must be SPECIFIC enough to drop directly into a FAQ or product page (e.g. "Működik a kamera internet nélkül is?", "Hol tárolják a felvételeket?"), not vague ("Aggályok a termékkel kapcsolatban").
  - Do NOT merge multiple distinct important issues into one broad item unless truly necessary — keep separate uncertainties as separate items.
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
    const withoutFences = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Step 1: Strip all control characters (char code < 32) except \n, \r and \t.
    // The model occasionally emits stray control characters that break JSON.parse.
    const cleaned = withoutFences.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

    // Parse the JSON response, with progressively more forgiving fallbacks.
    let analysis: unknown;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      // Step 2: Extract the outermost { ... } block and try parsing that.
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          analysis = JSON.parse(match[0]);
        } catch {
          analysis = null;
        }
      }
    }

    // Step 3: If parsing still failed, return a structured error so the UI can show
    // a friendly retry message instead of crashing on a raw parse error.
    if (analysis === undefined || analysis === null) {
      console.error("Analysis error: failed to parse AI response as JSON");
      return NextResponse.json(
        { error: "Az elemzés sikertelen, próbáld újra" },
        { status: 502 }
      );
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
