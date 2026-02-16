export interface DocumentChunk {
  id: string;
  page: number | null;
  text: string;
}

export interface Citation {
  chunk_id: string;
  page: number | null;
  snippet: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export interface RiskFlag {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  clause_type: string;
  why_it_matters: string;
  evidence: Array<{ chunk_id: string; quote: string; page: number | null }>;
  suggested_action: string;
}

export interface KeyClause {
  clause_type: string;
  summary: string;
  friendly_explanation: string;
  risk_notes: string;
  evidence: Array<{ chunk_id: string; quote: string; page: number | null }>;
}

export interface RiskReport {
  document_summary: string;
  risk_score: number; // 0-100
  top_red_flags: RiskFlag[];
  key_clauses: KeyClause[];
  missing_or_ambiguous: string[];
  negotiation_questions: string[];
}

export interface DocumentState {
  docId: string;
  filename: string;
  createdAt: number;
  chunks: DocumentChunk[];
  reportJson?: RiskReport;
  chatHistory: ChatMessage[];
}

export interface DocIndex {
  docId: string;
  filename: string;
  createdAt: number;
  chunks: DocumentChunk[];
  vectors: number[][]; // embedding per chunk
  reportJson?: RiskReport;
  chatHistory: ChatMessage[];
}
