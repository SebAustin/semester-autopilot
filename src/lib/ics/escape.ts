/** RFC 5545 §3.3.11 TEXT escaping. Order matters: backslash first. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

const MAX_OCTETS = 75;
/** Continuation lines start with a space, which costs one octet. */
const CHUNK_BUDGET = MAX_OCTETS - 1;

const encoder = new TextEncoder();

/**
 * RFC 5545 §3.1 line folding: content lines are capped at 75 octets;
 * longer lines break with CRLF + single space. Folding counts BYTES, not
 * characters, and must never split a multi-byte character.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line;

  const chunks: string[] = [];
  let current = "";
  let currentOctets = 0;

  for (const char of line) {
    const charOctets = encoder.encode(char).length;
    if (currentOctets + charOctets > CHUNK_BUDGET && current.length > 0) {
      chunks.push(current);
      current = "";
      currentOctets = 0;
    }
    current += char;
    currentOctets += charOctets;
  }
  if (current.length > 0) chunks.push(current);

  return chunks.join("\r\n ");
}
