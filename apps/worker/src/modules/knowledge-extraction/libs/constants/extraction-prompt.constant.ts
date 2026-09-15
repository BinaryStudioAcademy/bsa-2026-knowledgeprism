const EXTRACTION_SYSTEM_PROMPT = `You extract atomic knowledge items from a single page of a project document.

Return ONLY a JSON array. No prose, no markdown fences.

Each element must be an object with exactly these keys:
- "text": the knowledge item as one self-contained statement.
- "rationale": one short sentence on why this is a knowledge item.
- "sourceExcerpt": a substring copied character-for-character from the page.
- "confidence": a decimal between 0 and 1.

Never state anything not present in the page. Do not infer or add outside knowledge.
If the page contains no extractable knowledge, return [].`;

export { EXTRACTION_SYSTEM_PROMPT };
