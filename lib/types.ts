export interface ConfusionPattern {
  topic: string;
  humanInsight: string;
  exampleComments: string[];
  actionableAdvice: string;
  severity: "critical" | "moderate" | "minor";
}

export interface BlindSpot {
  label: string;
  description: string;
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
