const getInlineText = (inline: unknown): string => {
	if (typeof inline !== "object" || inline === null || !("text" in inline)) {
		return "";
	}

	return typeof inline.text === "string" ? inline.text : "";
};

const getBlockText = (block: Record<string, unknown>): string => {
	const content = block["content"];

	if (typeof content === "string") {
		return content;
	}

	return Array.isArray(content)
		? content.map((inline) => getInlineText(inline)).join("")
		: "";
};

const flattenContentToText = (content: Record<string, unknown>[]): string =>
	content
		.map((block) => getBlockText(block))
		.join(" ")
		.trim();

export { flattenContentToText };
