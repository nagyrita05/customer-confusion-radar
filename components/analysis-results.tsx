import { AnalysisResult, DataQualityStats } from "@/lib/types";
import { FindingCard } from "./finding-card";
import { ActionCard } from "./action-card";
import { BlindSpotCard } from "./blind-spot-card";
import { VakfoltChart } from "./vakfolt-chart";
import { DataQualityPanel } from "./data-quality-panel";
import { Lightbulb, HelpCircle, AlertTriangle } from "lucide-react";

interface AnalysisResultsProps {
  result: AnalysisResult;
  dataStats: DataQualityStats | null;
}

export function AnalysisResults({ result, dataStats }: AnalysisResultsProps) {
  const analyzedComments = result.analyzedComments ?? [];

  return (
    <div className="space-y-8">
      {/* Data Quality Panel */}
      {dataStats && <DataQualityPanel stats={dataStats} />}

      {/* Communication Blind Spots Bar Chart — same source of truth as the cards below */}
      {result.blindSpots.length > 0 && analyzedComments.length > 0 && (
        <section>
          <VakfoltChart
            blindSpots={result.blindSpots}
            analyzedComments={analyzedComments}
          />
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
          <img
            src="/enner-emblem.png"
            alt=""
            aria-hidden="true"
            className="h-6 w-6 shrink-0"
          />
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

        {/* Recurring Questions or Concerns */}
        {result.recurringQuestionsOrConcerns.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              {result.sectionType === "questions" ? (
                <HelpCircle className="h-5 w-5 text-accent" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-accent" />
              )}
              <h3 className="text-xl font-semibold text-foreground">
                {result.sectionType === "questions" ? "Leggyakoribb kérdések" : "Visszatérő aggodalmak"}
              </h3>
            </div>
            <ol className="list-decimal list-inside space-y-2">
              {result.recurringQuestionsOrConcerns.map((item, index) => (
                <li key={index} className="text-muted-foreground leading-relaxed">
                  {item}
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
                <BlindSpotCard
                  key={index}
                  blindSpot={blindSpot}
                  analyzedComments={analyzedComments}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Divider */}
      <hr className="border-t-2 border-border my-8" />

      {/* PART 2: Mit javaslunk (What we recommend) */}
      <div className="bg-primary -mx-4 px-4 py-8 sm:-mx-6 sm:px-6 rounded-xl space-y-8">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-accent" />
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground">Mit javaslunk</h2>
            <p className="text-[#D6DEF2]">AI-alapú kommunikációs fejlesztési javaslatok</p>
          </div>
        </div>

        {/* Action Items */}
        {result.topConfusions.length > 0 && (
          <section>
            <h3 className="text-xl font-semibold text-accent mb-4">
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
            <h3 className="text-xl font-semibold text-accent mb-4">
              Javasolt FAQ
            </h3>
            <ol className="list-decimal list-inside space-y-2">
              {result.suggestedFAQ.slice(0, 5).map((item, index) => (
                <li key={index} className="text-[#D6DEF2] leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Closing Insight */}
        {result.closingInsight && (
          <section className="mt-8">
            <div className="border-2 border-accent bg-[#0A2C6E] rounded-xl p-6">
              <p className="text-primary-foreground text-lg md:text-xl leading-relaxed font-medium text-center">
                {result.closingInsight}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
