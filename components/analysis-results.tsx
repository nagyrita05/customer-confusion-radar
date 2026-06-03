import { AnalysisResult } from "@/lib/types";
import { ConfusionCard } from "./confusion-card";
import { BlindSpotCard } from "./blind-spot-card";

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <div className="space-y-10">
      {/* Headline Insight */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight text-balance">
          {result.headline}
        </h2>
      </section>

      {/* Confusion Patterns */}
      {result.topConfusions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Confusion Patterns
          </h2>
          <div className="space-y-4">
            {result.topConfusions.map((pattern, index) => (
              <ConfusionCard key={index} pattern={pattern} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Recurring Questions */}
      {result.recurringQuestions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Recurring Questions
          </h2>
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
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Communication Blind Spots
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {result.blindSpots.map((blindSpot, index) => (
              <BlindSpotCard key={index} blindSpot={blindSpot} />
            ))}
          </div>
        </section>
      )}

      {/* Suggested FAQ */}
      {result.suggestedFAQ.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Suggested FAQ
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            {result.suggestedFAQ.map((item, index) => (
              <li key={index} className="text-muted-foreground leading-relaxed">
                {item}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Closing Insight */}
      {result.closingInsight && (
        <section className="border-t border-border pt-6">
          <p className="text-muted-foreground italic text-lg leading-relaxed">
            {result.closingInsight}
          </p>
        </section>
      )}
    </div>
  );
}
