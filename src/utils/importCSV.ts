import type { Size } from '../types/index.ts';

export interface ParsedRow {
  dog: string;
  breed: string;
  size: Size;
  human: string;
}

export interface ImportResult {
  valid: ParsedRow[];
  skipped: { raw: string[]; reason: string }[];
}

// Flexible header aliases
const DOG_ALIASES    = ['dog', 'name', 'dog name', 'dogname', 'dog_name'];
const BREED_ALIASES  = ['breed', 'dog breed', 'dogbreed', 'breed name'];
const SIZE_ALIASES   = ['size', 'height', 'jump height', 'class'];
const HUMAN_ALIASES  = ['handler', 'human', 'owner', 'handler name', 'handlername'];

function matchHeader(header: string, aliases: string[]): boolean {
  return aliases.includes(header.toLowerCase().trim());
}

function normalizeSize(raw: string): Size | null {
  const s = raw.trim().toLowerCase();
  if (s === 's' || s === 'small')                          return 'S';
  if (s === 'm' || s === 'medium' || s === 'med')          return 'M';
  if (s === 'i' || s === 'intermediate' || s === 'inter')  return 'I';
  if (s === 'l' || s === 'large')                          return 'L';
  return null;
}

/** Minimal CSV parser — handles quoted fields with commas inside */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cur = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }

  return rows;
}

export function parseCSVText(text: string): ImportResult {
  const rows = parseCSV(text);
  if (rows.length < 2) return { valid: [], skipped: [] };

  const headers = rows[0];
  const dogIdx    = headers.findIndex((h) => matchHeader(h, DOG_ALIASES));
  const breedIdx  = headers.findIndex((h) => matchHeader(h, BREED_ALIASES));
  const sizeIdx   = headers.findIndex((h) => matchHeader(h, SIZE_ALIASES));
  const humanIdx  = headers.findIndex((h) => matchHeader(h, HUMAN_ALIASES));

  if (dogIdx === -1 || sizeIdx === -1 || humanIdx === -1) {
    return { valid: [], skipped: [{ raw: headers, reason: 'Could not detect required columns (Dog, Size, Handler)' }] };
  }

  const valid: ParsedRow[] = [];
  const skipped: { raw: string[]; reason: string }[] = [];

  for (const row of rows.slice(1)) {
    const dog   = row[dogIdx]?.trim() ?? '';
    const human = row[humanIdx]?.trim() ?? '';
    const sizeRaw = row[sizeIdx]?.trim() ?? '';
    const breed = breedIdx >= 0 ? (row[breedIdx]?.trim() || '—') : '—';
    const size  = normalizeSize(sizeRaw);

    if (!dog)   { skipped.push({ raw: row, reason: 'Missing dog name' }); continue; }
    if (!human) { skipped.push({ raw: row, reason: 'Missing handler name' }); continue; }
    if (!size)  { skipped.push({ raw: row, reason: `Unknown size "${sizeRaw}" (use S/M/I/L)` }); continue; }

    valid.push({ dog, breed, size, human });
  }

  return { valid, skipped };
}

/** Extract Google Sheets ID from any Sheets URL */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? null;
}

/** Fetch a Google Sheets as CSV text. Tries export endpoint, falls back to pub endpoint. */
export async function fetchSheetCSV(url: string): Promise<string> {
  const id = extractSheetId(url);
  if (!id) throw new Error('Could not find a Google Sheets ID in that URL.');

  // Extract optional gid (tab)
  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch?.[1] ?? '0';

  const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;

  const res = await fetch(exportUrl);
  if (!res.ok) throw new Error(`Could not fetch sheet (status ${res.status}). Make sure it is shared as "Anyone with the link can view".`);

  return res.text();
}
