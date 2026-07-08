export interface Buyer {
  id: string;
  token: string;
  community: string;
  lot: string;
  family_name: string;
  signer_name: string | null;
  signed_at: string | null;
}

export type SelectionsMap = Record<string, string>;
export type UpgradeSelectionsMap = Record<string, string[]>;

export interface NoteEntry {
  author: "buyer" | "builder";
  text: string;
  time: string;
}

export type NotesMap = Record<string, NoteEntry[]>;
