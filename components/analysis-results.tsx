import { AnalysisResult } from "@/lib/types";
import { FindingCard } from "./finding-card";
import { ActionCard } from "./action-card";
import { BlindSpotCard } from "./blind-spot-card";
import { ConfusionGauge } from "./confusion-gauge";
import { Search, Lightbulb } from "lucide-react";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="space-y-8">
      {/* Confusion Score Gauge */}
      {result.confusionScore !== undefined && (
        <section className="flex justify-center py-4">
          <ConfusionGauge score={result.confusionScore} />
        </section>
      )}

      {/* Headline Insight */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight text-balance">
          {result.headline}
        </h2>
      </section>

      {/* PART 1: Mit találtunk (What we found) */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Search className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mit találtunk</h2>
            <p className="text-muted-foreground">A kommentekből kinyert minták és hiányok</p>
          </div>
        </div>

        {/* Confusion Patterns */}
        {result.topConfusions.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Félreértési minták
            </h3>
            <div className="space-y-4">
              {result.topConfusions.map((pattern, index) => (
                <FindingCard key={index} pattern={pattern} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Recurring Questions */}
        {result.recurringQuestions.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Leggyakoribb kérdések
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              {result.recurringQuestions.map((question, index) => (
                <li key={index} className="text-muted-foreground leading-relaxed">
                  {question}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Communication Blind Spots */}
        {result.blindSpots.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Kommunikációs vakfoltok
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.blindSpots.map((blindSpot, index) => (
                <BlindSpotCard key={index} blindSpot={blindSpot} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Divider */}
      <hr className="border-t-2 border-border my-8" />

      {/* PART 2: Mit javaslunk (What we recommend) */}
      <div className="bg-[#F8F8F8] dark:bg-muted/30 -mx-4 px-4 py-8 sm:-mx-6 sm:px-6 rounded-xl space-y-8">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Mit javaslunk</h2>
            <p className="text-muted-foreground">AI-alapú kommunikációs fejlesztési javaslatok</p>
          </div>
        </div>

        {/* Action Items */}
        {result.topConfusions.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Ezt csináld meg ezen a héten
            </h3>
            <div className="space-y-3">
              {result.topConfusions.map((pattern, index) => (
                <ActionCard key={index} pattern={pattern} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Suggested FAQ */}
        {result.suggestedFAQ.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Javasolt FAQ
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              {result.suggestedFAQ.slice(0, 5).map((item, index) => (
                <li key={index} className="text-muted-foreground leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Closing Insight */}
        {result.closingInsight && (
          <section className="mt-8">
            <div className="border-2 border-primary/30 bg-white dark:bg-background rounded-xl p-6">
              <p className="text-foreground text-lg md:text-xl leading-relaxed font-medium text-center">
                {result.closingInsight}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
