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
  confusionScore: number;
  topConfusions: ConfusionPattern[];
  recurringQuestionsOrConcerns: string[];
  sectionType: "questions" | "concerns";
  blindSpots: BlindSpot[];
  suggestedFAQ: string[];
  closingInsight: string;
}
