// src/types.ts
export interface DefinitionOut {
  display_term: string;
  definition_text: string;
  act_title: string;
  act_frbr_uri: string;
  section_eid: string;
}

export interface DifferenceOut {
  act_title: string;
  quote: string;
  note: string;
}

export interface ComparisonResponse {
  term: string;
  definitions: DefinitionOut[];
  difference_summary: string | null;
  differences: DifferenceOut[];
}

export interface MultiActTerm {
  term: string;
  display_term: string;
  act_count: number;
}

export interface Stats {
  acts: number;
  defined_terms: number;
  multi_act_terms: number;
}
