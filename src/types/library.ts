export type DocumentCategory = 'score' | 'book';

export type DocumentStatus = 'published' | 'archived';

export type DocumentSourceType = 'curated_sample' | 'uploaded_pdf';

export type PaperTone = 'ivory' | 'alabaster' | 'night';

export type UserRole = 'guest' | 'member' | 'authorized_researcher' | 'librarian';

export type EraOrField =
  | 'Baroque'
  | 'Classical'
  | 'Romantic'
  | 'Impressionist'
  | 'Contemporary'
  | 'Musicology & Acoustics';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  institution: string;
  role: UserRole;
  isLoggedIn: boolean;
  canScreenshot: boolean;
  canDownload: false; // Strictly locked to protect author copyright
  licenseToken: string;
}

export interface ScoreSystemData {
  measureStart: number;
  tempoText?: string;
  timeSignature?: string;
  keySignatureName?: string;
  clefTop: 'treble' | 'alto';
  clefBottom: 'bass' | 'tenor' | 'treble';
  dynamicMarking: string;
  expressionNote?: string;
  /** Encoded pattern variant so each system renders distinct musical phrases */
  phraseVariant: 1 | 2 | 3 | 4;
}

export interface DocumentPage {
  pageNumber: number;
  sectionId: string;
  runningHeader: string;
  pageType: 'score_notation' | 'treatise_prose' | 'hybrid_analysis';
  titleOnPage?: string;
  subtitleOnPage?: string;
  composerOrAuthorOnPage?: string;
  scoreSystems?: ScoreSystemData[];
  proseParagraphs?: string[];
  pullQuote?: string;
  figureCaption?: string;
  footnotes?: string[];
}

export interface DocumentSection {
  id: string;
  indexLabel: string; // e.g. "I.", "II.", "Chapter 01"
  title: string;
  subtitle?: string;
  tempoOrTopic: string;
  startPage: number;
}

export interface LibraryDocument {
  id: string;
  accessionNumber: string; // e.g., "GLR-2026-001"
  title: string;
  subtitle: string;
  creator: string; // Composer or Author
  creatorDates: string;
  catalogNumber: string; // e.g., "Op. 57", "BWV 1004", "ISBN 978-3-7957"
  category: DocumentCategory;
  status: DocumentStatus;
  sourceType: DocumentSourceType;
  pdfDataUrl?: string; // Object URL or ArrayBuffer-backed Blob URL for real uploaded PDFs
  pdfFileName?: string;
  pdfFileSizeLabel?: string;
  eraOrField: EraOrField;
  instrumentation: string;
  keySignature: string;
  tempoMarking: string;
  durationOrExtent: string;
  editionType: string; // e.g., "Urtext Critical Edition", "First Archival Monograph"
  publisher: string;
  publicationYear: number;
  pageCount: number;
  copyrightHolder: string;
  copyrightNotice: string;
  coverImage: string;
  featured?: boolean;
  synopsis: string;
  editorialNotes: string;
  sections: DocumentSection[];
  pages: DocumentPage[];
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  actionType:
    | 'RIGHT_CLICK_BLOCKED'
    | 'SHORTCUT_CAPTURE_BLOCKED'
    | 'PRINT_EXPORT_BLOCKED'
    | 'FOCUS_BLUR_SHIELD'
    | 'AUTHORIZED_CAPTURE_WATERMARKED';
  message: string;
  userRole: UserRole;
  userName?: string;
  documentTitle?: string;
}
