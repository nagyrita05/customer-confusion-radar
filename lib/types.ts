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

export interface AnalysisResult {
  headline: string;
  topConfusions: ConfusionPattern[];
  recurringQuestions: string[];
  blindSpots: BlindSpot[];
  suggestedFAQ: string[];
  closingInsight: string;
}
