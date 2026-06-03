"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalysisResult } from "@/lib/types";
import { sampleComments } from "@/lib/sample-data";
import { AnalysisResults } from "@/components/analysis-results";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [comments, setComments] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!comments.trim()) {
      setError("Please enter some comments to analyze");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comments }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze comments");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
            Customer Confusion Radar
          </h1>
          <p className="text-lg text-muted-foreground">
            Your comments reveal where you lose potential customers.
          </p>
        </header>

        {/* Input Section */}
        <section className="mb-10">
          <label
            htmlFor="comments"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Paste comments, reviews or support messages (one per line)
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full h-48 p-4 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            placeholder="Ez online vagy személyes lesz?&#10;Kezdőknek is ajánlott?&#10;Mennyi ideig visszanézhető a felvétel?"
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
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleLoadSample}
              disabled={isLoading}
              size="lg"
            >
              Load sample
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
            <AnalysisResults result={result} />
          </section>
        )}
      </div>
    </main>
  );
}
