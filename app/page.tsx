"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisResult, DataQualityStats } from "@/lib/types";
import { sampleComments } from "@/lib/sample-data";
import { AnalysisResults } from "@/components/analysis-results";
import { cleanFacebookComments } from "@/lib/clean-comments";
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
      // Clean Facebook metadata and extract real comment blocks
      const { cleanedComments, stats } = cleanFacebookComments(comments);
      
      setDataStats(stats);
      
      if (cleanedComments.length === 0) {
        throw new Error("Nem találtunk elemezhető kommenteket a bemenetben");
      }

      // Join cleaned comments for API
      const cleanedText = cleanedComments.join('\n---\n');
      const commentCount = cleanedComments.length;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments: cleanedText, commentCount }),
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
      {/* Hero Band */}
      <div
        className="bg-[#F5B700] pb-16"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 40px))" }}
      >
        <div className="max-w-3xl mx-auto px-4 pt-12 md:pt-16 pb-4">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Title block (left) */}
            <div className="order-2 sm:order-1">
              <h1 className="text-2xl md:text-3xl font-bold text-[#002060] mb-2 text-balance">
                Kommunikációs Vakfolt Elemző
              </h1>
              <p className="text-lg text-[#4A3D00]">
                Fedezd fel, mit nem kommunikálsz elég egyértelműen.
              </p>
            </div>
            {/* Combined logo, directly on the yellow band (top-right on desktop, above title on mobile) */}
            <img
              src="/enner-logo.png"
              alt="ENNER logó"
              className="order-1 sm:order-2 h-[52px] w-auto self-start shrink-0"
            />
          </header>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-12 md:pb-16">
        {/* Input Section */}
        <section className="mb-10 mt-4">
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
            className="w-full h-48 p-4 border border-input rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
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
