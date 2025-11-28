/**
 * Cover Letter Type Definitions
 * Matches backend structure from cover_letters.py
 */

export interface CoverLetterContent {
  paragraphs: string[];
}

export interface CoverLetter {
  id: number;
  title: string;
  job_id: number;
  creation_date: string;
  last_updated: string;
  content: CoverLetterContent;
}

export interface CoverLetterListItem {
  id: number;
  title: string;
  job_id: number;
  last_updated: string;
}

export interface CreateUpdateCoverLetterRequest {
  id?: number;
  title: string;
  job_id: number;
  content: CoverLetterContent;
}

export interface CreateUpdateCoverLetterResponse {
  success: boolean;
  cover_letter_id: number;
  message: string;
}
