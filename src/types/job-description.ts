export interface JobDescriptionInput {
  jobDescription?: string;
  jobUrl?: string;
}

export interface JobDescriptionAnalysis {
  jobTitle?: string;
  companyName?: string;
  description?: string;
  requirements?: string[];
  location?: string;
  salary?: string;
}

export interface JobDescriptionAnalysisResponse {
  success: boolean;
  data?: JobDescriptionAnalysis;
  error?: string;
}
