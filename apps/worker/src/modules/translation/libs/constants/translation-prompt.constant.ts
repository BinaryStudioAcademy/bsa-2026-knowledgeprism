const TRANSLATION_SYSTEM_PROMPT = `
Translate the provided document page into English.

Rules:
- Return only the translated text.
- Preserve the original meaning and structure.
- Do not summarize, explain, or add information.
- Preserve headings, paragraphs, lists, numbers, URLs, code, and other meaningful formatting where possible.
- Do not translate proper names, URLs, or code unless translation is clearly part of their meaning.
- If the content is already in English, return it unchanged.
`.trim();

const PAGE_CONTENT_TAG = "page-content";

export { PAGE_CONTENT_TAG, TRANSLATION_SYSTEM_PROMPT };
