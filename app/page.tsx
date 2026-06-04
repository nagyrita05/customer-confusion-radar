"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisResult, DataQualityStats } from "@/lib/types";
import { sampleComments } from "@/lib/sample-data";
import { AnalysisResults } from "@/components/analysis-results";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [comments, setComments] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dataStats, setDataStats] = useState<DataQualityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!comments.trim()) {
      setError("Kérlek adj meg kommenteket az elemzéshez");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setDataStats(null);

    try {
      const allLines = comments.split('\n');
      const totalLines = allLines.length;
      
      // Filter out empty lines and metadata-like lines (timestamps, usernames, etc.)
      // Keep emoji-only lines as they represent engagement signals
      const metadataPatterns = [
        /^\d{1,2}:\d{2}/, // Time patterns like "12:34"
        /^\d{4}[-/]\d{2}[-/]\d{2}/, // Date patterns
        /^@\w+/, // Username mentions
        /^https?:\/\//, // URLs
        /^\[.*\]$/, // Bracketed content
        /^#\w+/, // Hashtags alone
        /^={2,}$/, // Separator lines
        /^-{2,}$/, // Separator lines
        /^\[?(GIF|gif|Gif)\]?$/, // GIF-only reactions
        /^\[?(image|Image|IMAGE|kép|Kép|KÉP)\]?$/, // Image-only indicators
      ];

      // Emoji detection regex - matches lines that are only emojis (with optional spaces)
      const emojiOnlyPattern = /^[\p{Emoji}\s]+$/u;
      
      const cleanedLines = allLines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        
        // Keep emoji-only lines
        if (emojiOnlyPattern.test(trimmed)) return true;
        
        return !metadataPatterns.some(pattern => pattern.test(trimmed));
      });
      
      const commentCount = cleanedLines.length;
      const removedMetadata = totalLines - commentCount;
      
      setDataStats({
        totalLines,
        removedMetadata,
        analyzedComments: commentCount,
      });

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments, commentCount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nem sikerült elemezni a kommenteket");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hiba történt");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setComments(sampleComments);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
            Kommunikációs Vakfolt Elemző
          </h1>
          <p className="text-lg text-muted-foreground">
            Fedezd fel, mit nem kommunikálsz elég egyértelműen.
          </p>
        </header>

        {/* Input Section */}
        <section className="mb-10">
          <label
            htmlFor="comments"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Másold be a kommenteket, értékeléseket vagy ügyfélszolgálati üzeneteket (soronként egyet)
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full h-48 p-4 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Másold be a kommenteket..."
            disabled={isLoading}
          />

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !comments.trim()}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Elemzés folyamatban...
                </>
              ) : (
                "Elemzés indítása"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadSample}
              disabled={isLoading}
              size="lg"
            >
              Minta betöltése
            </Button>
          </div>

          {error && (
            <p className="mt-4 text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </section>

        {/* Results Section */}
        {result && (
          <section className="border-t border-border pt-10">
            <AnalysisResults result={result} dataStats={dataStats} />
          </section>
        )}
      </div>
    </main>
  );
}
