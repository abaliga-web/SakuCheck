export interface DiagnosticMetadata {
  location: string;
  season: string;
}

export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}
