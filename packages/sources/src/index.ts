import type { RawLead, SearchIntent } from "@krenora/shared";

export interface LeadSource {
  readonly name: string;
  search(intent: SearchIntent): Promise<RawLead[]>;
}

export type { RawLead, SearchIntent } from "@krenora/shared";
export { GooglePlacesSource, GooglePlacesApiError } from "./google-places";
