// src/types.ts
export interface DefinitionOut {
  display_term: string;
  definition_text: string;
  act_title: string;
  act_frbr_uri: string;
  section_eid: string;
}

export interface ComparisonResponse {
  term: string;
  definitions: DefinitionOut[];
  difference_summary: string | null;
}
