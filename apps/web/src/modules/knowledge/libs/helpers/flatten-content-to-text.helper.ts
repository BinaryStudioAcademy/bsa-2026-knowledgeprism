const flattenContentToText = (content: Record<string, unknown>[]): string =>
	content
		.map((block) =>
			"text" in block && typeof block["text"] === "string" ? block["text"] : "",
		)
		.join(" ")
		.trim();

export { flattenContentToText };
