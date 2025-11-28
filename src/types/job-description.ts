export interface JobDescriptionInput {
  jobDescription?: string;
  jobUrl?: string;
}

export interface JobDescriptionAnalysis {
  jobTitle?: string;
  companyName?: string;
  description?: string;
  keywords?: string[];
  location?: string;
  salary?: string;
}

export interface JobDescriptionAnalysisResponse {
  success: boolean;
  data?: JobDescriptionAnalysis;
  error?: string;
}

export interface JobDescriptionSaveResponse {
  success: boolean;
  data?: {
    jobId: number;
    keywords: {
      id: string;
      label: string;
    }[];
  };
  error?: string;
}
