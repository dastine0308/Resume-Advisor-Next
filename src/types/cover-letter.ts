export interface CoverLetterContent {
  paragraphs: string[];
  closing_signature: string;
  company: string;
  descriptive_prompt: string;
  position: string;
  recipient: string;
  resume_id: string | null;
  tone: "Professional" | "Friendly" | "Enthusiastic" | "Formal";
}

export interface CoverLetter {
  id: string;
  title: string;
  job_id: string;
  creation_date: string;
  last_updated: string;
  content: CoverLetterContent;
}

export interface CoverLetterListItem {
  id: string;
  title: string;
  job_id: string;
  last_updated: string;
}

export interface CreateUpdateCoverLetterRequest {
  id?: string;
  title: string;
  job_id: string;
  content: CoverLetterContent;
}

export interface CreateUpdateCoverLetterResponse {
  success: boolean;
  cover_letter_id: string;
  message: string;
}
