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

The JSON structure must be:
{
  "headline": "X people asked the same question in different words",
  "confusionScore": 65,
  "topConfusions": [
    {
      "topic": "short topic name",
      "humanInsight": "plain language explanation of the confusion pattern",
      "exampleComments": ["actual example from input", "another example"],
      "actionableAdvice": "one concrete thing to fix this week",
      "severity": "critical|moderate|minor"
    }
  ],
  "recurringQuestions": ["Question 1?", "Question 2?", "Question 3?"],
  "blindSpots": [
    {
      "label": "short label",
      "description": "what information is missing from your communication"
    }
  ],
  "suggestedFAQ": ["FAQ item 1", "FAQ item 2", "FAQ item 3", "FAQ item 4", "FAQ item 5"],
  "closingInsight": "one strong sentence summarizing the biggest opportunity"
}

IMPORTANT: confusionScore is a number from 0-100 representing the percentage of comments that show confusion, uncertainty, or missing information. Calculate this based on how many comments contain questions, uncertainty, or confusion vs. clear statements.`;

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
            content: `Analyze these customer comments for recurring confusion patterns. The comments may be in any language - analyze them in their original language but provide your response in the same language as the comments:\n\n${comments}`,
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
