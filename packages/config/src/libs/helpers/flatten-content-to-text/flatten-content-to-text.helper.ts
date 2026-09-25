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

const isBlock = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getChildBlocks = (
	block: Record<string, unknown>,
): Record<string, unknown>[] => {
	const children = block["children"];

	return Array.isArray(children)
		? children.filter((child) => isBlock(child))
		: [];
};

const flattenContentToText = (content: Record<string, unknown>[]): string =>
	content
		.map((block) =>
			[getBlockText(block), flattenContentToText(getChildBlocks(block))]
				.join(" ")
				.trim(),
		)
		.filter((text) => text !== "")
		.join(" ");

export { flattenContentToText };
