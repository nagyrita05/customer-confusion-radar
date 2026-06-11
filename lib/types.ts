export interface ConfusionPattern {
  topic: string;
  humanInsight: string;
  exampleComments: string[];
  actionableAdvice: string;
  severity: "critical" | "moderate" | "minor";
}

export interface BlindSpot {
  /** Short 2-3 word label, used in charts and badges. */
  shortLabel: string;
  /** Complete missing-communication statement explaining what information is missing. */
  fullDescription: string;
  /** 1-based input comment numbers that support / reveal this blind spot. */
  commentIndexes: number[];
}

export interface DataQualityStats {
  totalLines: number;
  removedMetadata: number;
  analyzedComments: number;
}

export interface AnalysisResult {
  headline: string;
  flaggedCommentIndexes: number[];
  topConfusions: ConfusionPattern[];
  recurringQuestionsOrConcerns: string[];
  sectionType: "questions" | "concerns";
  blindSpots: BlindSpot[];
  suggestedFAQ: string[];
  closingInsight: string;
  /** The cleaned comments that were analyzed, in the same order the AI saw them (1-based indexes). */
  analyzedComments?: string[];
}
