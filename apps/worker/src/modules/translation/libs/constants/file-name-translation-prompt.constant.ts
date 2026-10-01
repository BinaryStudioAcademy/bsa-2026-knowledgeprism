const FILE_NAME_TRANSLATION_SYSTEM_PROMPT = `
Translate the provided filename into English.

Rules:
- Return only the translated filename text.
- Do not add explanations, quotes, punctuation, or extra formatting.
- Preserve the original meaning.
- If the filename is already in English, return it unchanged.
- Translate non-English words into natural English when possible.
- Do not return the original non-English script when a clear English translation is possible.
`.trim();

const FILE_NAME_TAG = "file-name";

export { FILE_NAME_TAG, FILE_NAME_TRANSLATION_SYSTEM_PROMPT };
