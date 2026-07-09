export interface Buyer {
  id: string;
  token: string;
  community: string;
  lot: string;
  family_name: string;
  sqft: number | null;
  signer_name: string | null;
  signed_at: string | null;
}

export type SelectionsMap = Record<string, string>;
export type UpgradeSelectionsMap = Record<string, string[]>;

// One row of data/pricing.xlsx, resolved for a given option key.
// flat overrides the app's built-in price; perSqft (when set) overrides both
// and computes as perSqft × the buyer's house size; tbd marks "Price TBD".
export interface OptionPricing {
  flat?: number;
  perSqft?: number;
  tbd?: boolean;
}
export type PricingMap = Record<string, OptionPricing>;

export interface NoteEntry {
  author: "buyer" | "builder";
  text: string;
  time: string;
}

export type NotesMap = Record<string, NoteEntry[]>;
