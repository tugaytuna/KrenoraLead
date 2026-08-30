export type {
  EnrichmentPolicy,
  VerticalManifest,
  VerticalModule,
} from "./contracts";
export type { ScoringProfile } from "@krenora/scoring";
export { VerticalModuleNotFoundError, VerticalRegistry } from "./registry";
export { KindergartenVerticalModule, kindergartenVertical } from "./kindergarten/index";

import { kindergartenVertical } from "./kindergarten/index";
import { VerticalRegistry } from "./registry";

export function createDefaultVerticalRegistry() {
  return new VerticalRegistry([kindergartenVertical]);
}
