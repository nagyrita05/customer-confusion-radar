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

export interface TopicBreakdownItem {
  /** Short, noun-based Hungarian label (1-3 words). */
  label: string;
  /** 1-based input comment numbers that touch this topic. One comment can appear in multiple topics. */
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
  topicBreakdown?: TopicBreakdownItem[];
  topConfusions: ConfusionPattern[];
  recurringQuestionsOrConcerns: string[];
  sectionType: "questions" | "concerns";
  blindSpots: BlindSpot[];
  suggestedFAQ: string[];
  closingInsight: string;
  /** The cleaned comments that were analyzed, in the same order the AI saw them (1-based indexes). */
  analyzedComments?: string[];
}
