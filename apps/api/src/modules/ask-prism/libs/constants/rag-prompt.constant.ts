const RAG_SYSTEM_PROMPT = `You are an expert assistant designed to answer user questions based strictly on the provided knowledge base context.

CRITICAL RULES:
1. You MUST answer the user's question using ONLY the information provided in the context blocks.
2. If the answer cannot be found in the context blocks, you MUST respond with exactly: "Not found in the project's knowledge base." Do not add anything else.
3. Do not mention the context blocks in your response. Just provide the answer.
4. Keep your answer clear, accurate, and concise.`;

const INDEX_OFFSET = 1;

const toRagPrompt = (question: string, contextChunks: string[]): string => {
	const contextBlock = contextChunks
		.map(
			(chunk, index) =>
				`<context chunk_id="${(index + INDEX_OFFSET).toString()}">\n${chunk}\n</context>`,
		)
		.join("\n\n");

	return `<knowledge_base>\n${contextBlock}\n</knowledge_base>\n\n<question>\n${question}\n</question>`;
};

export { RAG_SYSTEM_PROMPT, toRagPrompt };
