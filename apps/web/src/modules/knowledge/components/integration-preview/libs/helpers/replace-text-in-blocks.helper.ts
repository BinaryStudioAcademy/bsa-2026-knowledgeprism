import { type PartialBlock } from "@blocknote/core";

type Replacement = {
	from: string;
	to: string;
};

type ReplaceState = {
	isReplaced: boolean;
};

const replaceInText = (
	text: string,
	{ from, to }: Replacement,
	state: ReplaceState,
): string => {
	if (state.isReplaced || !text.includes(from)) {
		return text;
	}

	state.isReplaced = true;

	return text.replace(from, () => to);
};

const replaceInRuns = (
	runs: unknown[],
	replacement: Replacement,
	state: ReplaceState,
): unknown[] => {
	return runs.map((run) => {
		if (state.isReplaced) {
			return run;
		}

		if (
			run === null ||
			typeof run !== "object" ||
			!("text" in run) ||
			typeof run.text !== "string"
		) {
			return run;
		}

		return { ...run, text: replaceInText(run.text, replacement, state) };
	});
};

const replaceInContent = (
	block: PartialBlock,
	replacement: Replacement,
	state: ReplaceState,
): PartialBlock => {
	const { content } = block;

	if (typeof content === "string") {
		return { ...block, content: replaceInText(content, replacement, state) };
	}

	if (Array.isArray(content)) {
		return {
			...block,
			content: replaceInRuns(content, replacement, state),
		} as PartialBlock;
	}

	return block;
};

const replaceInBlock = (
	block: PartialBlock,
	replacement: Replacement,
	state: ReplaceState,
): PartialBlock => {
	const withContent = replaceInContent(block, replacement, state);

	if (!withContent.children) {
		return withContent;
	}

	return {
		...withContent,
		children: withContent.children.map((child) =>
			replaceInBlock(child, replacement, state),
		),
	};
};

const replaceTextInBlocks = (
	blocks: PartialBlock[],
	replacement: Replacement,
): null | PartialBlock[] => {
	const state: ReplaceState = { isReplaced: false };
	const replacedBlocks = blocks.map((block) =>
		replaceInBlock(block, replacement, state),
	);

	return state.isReplaced ? replacedBlocks : null;
};

export { replaceTextInBlocks };
