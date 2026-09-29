import { type JSX, type ReactNode } from "react";

type InlineToken = {
	content: string;
	nextIndex: number;
};

type LinkToken = {
	label: string;
	nextIndex: number;
	url: string;
};

type MarkdownBlock =
	| { content: string; language?: string; type: "code" }
	| { items: string[]; type: "ordered-list" }
	| { items: string[]; type: "unordered-list" }
	| { level: number; text: string; type: "heading" }
	| { text: string; type: "paragraph" }
	| { text: string; type: "quote" }
	| { type: "divider" };

type ParseBlockResult<T extends MarkdownBlock> = {
	block: T;
	nextIndex: number;
};

const EMPTY_LENGTH = 0;
const INDEX_OFFSET_ONE = 1;
const INDEX_OFFSET_TWO = 2;
const NOT_FOUND_INDEX = -1;
const CODE_PREFIX_LENGTH = 3;

const HEADING_LEVEL_1 = 1;
const HEADING_LEVEL_2 = 2;
const HEADING_LEVEL_3 = 3;
const MAX_HEADING_LEVEL = 6;
const MIN_HEADING_LEVEL = 1;

const DIVIDERS = new Set(["***", "---", "___"]);
const UNORDERED_LIST_ITEM_REGEX = /^\s*[-*+]\s+/;
const ORDERED_LIST_ITEM_REGEX = /^\s*\d+\.\s+/;

const isCodeBlockDelimiter = (line: string): boolean => {
	return line.trimStart().startsWith("```");
};

const isQuoteLine = (line: string): boolean => {
	return line.trimStart().startsWith(">");
};

const isUnorderedListLine = (line: string): boolean => {
	return UNORDERED_LIST_ITEM_REGEX.test(line);
};

const isOrderedListLine = (line: string): boolean => {
	return ORDERED_LIST_ITEM_REGEX.test(line);
};

const isDividerLine = (line: string): boolean => {
	return DIVIDERS.has(line.trim());
};

const tryParseHeading = (
	line: string,
): Extract<MarkdownBlock, { type: "heading" }> | null => {
	const trimmed = line.trim();
	if (!trimmed.startsWith("#")) {
		return null;
	}

	let hashCount = 0;
	while (hashCount < trimmed.length && trimmed[hashCount] === "#") {
		hashCount++;
	}

	if (
		hashCount < MIN_HEADING_LEVEL ||
		hashCount > MAX_HEADING_LEVEL ||
		trimmed[hashCount] !== " "
	) {
		return null;
	}

	const headingText = trimmed.slice(hashCount).trim();

	return {
		level: hashCount,
		text: headingText,
		type: "heading",
	};
};

const isSpecialBlockStart = (line: string): boolean => {
	const trimmed = line.trimStart();

	return (
		isCodeBlockDelimiter(trimmed) ||
		tryParseHeading(trimmed) !== null ||
		isQuoteLine(trimmed) ||
		isUnorderedListLine(line) ||
		isOrderedListLine(line) ||
		isDividerLine(line)
	);
};

const tryReadCode = (text: string, index: number): InlineToken | null => {
	if (text[index] !== "`") {
		return null;
	}

	const nextBacktick = text.indexOf("`", index + INDEX_OFFSET_ONE);
	if (nextBacktick === NOT_FOUND_INDEX) {
		return null;
	}

	return {
		content: text.slice(index + INDEX_OFFSET_ONE, nextBacktick),
		nextIndex: nextBacktick + INDEX_OFFSET_ONE,
	};
};

const tryReadBold = (text: string, index: number): InlineToken | null => {
	if (!text.startsWith("**", index)) {
		return null;
	}

	const nextDouble = text.indexOf("**", index + INDEX_OFFSET_TWO);
	if (nextDouble === NOT_FOUND_INDEX) {
		return null;
	}

	return {
		content: text.slice(index + INDEX_OFFSET_TWO, nextDouble),
		nextIndex: nextDouble + INDEX_OFFSET_TWO,
	};
};

const tryReadItalic = (text: string, index: number): InlineToken | null => {
	if (text[index] !== "*" || text.startsWith("**", index)) {
		return null;
	}

	const nextAsterisk = text.indexOf("*", index + INDEX_OFFSET_ONE);
	if (nextAsterisk === NOT_FOUND_INDEX) {
		return null;
	}

	return {
		content: text.slice(index + INDEX_OFFSET_ONE, nextAsterisk),
		nextIndex: nextAsterisk + INDEX_OFFSET_ONE,
	};
};

const tryReadStrike = (text: string, index: number): InlineToken | null => {
	if (!text.startsWith("~~", index)) {
		return null;
	}

	const nextTilde = text.indexOf("~~", index + INDEX_OFFSET_TWO);
	if (nextTilde === NOT_FOUND_INDEX) {
		return null;
	}

	return {
		content: text.slice(index + INDEX_OFFSET_TWO, nextTilde),
		nextIndex: nextTilde + INDEX_OFFSET_TWO,
	};
};

const tryReadLink = (text: string, index: number): LinkToken | null => {
	if (text[index] !== "[") {
		return null;
	}

	const closingBracket = text.indexOf("]", index + INDEX_OFFSET_ONE);
	if (
		closingBracket === NOT_FOUND_INDEX ||
		text[closingBracket + INDEX_OFFSET_ONE] !== "("
	) {
		return null;
	}

	const closingParen = text.indexOf(")", closingBracket + INDEX_OFFSET_TWO);
	if (closingParen === NOT_FOUND_INDEX) {
		return null;
	}

	const label = text.slice(index + INDEX_OFFSET_ONE, closingBracket);
	const url = text.slice(closingBracket + INDEX_OFFSET_TWO, closingParen);

	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		return null;
	}

	return {
		label,
		nextIndex: closingParen + INDEX_OFFSET_ONE,
		url,
	};
};

const renderInlineMarkdown = (text: string): ReactNode[] => {
	const elements: ReactNode[] = [];
	let index = 0;
	let textBuffer = "";

	const flushBuffer = (): void => {
		if (textBuffer.length === EMPTY_LENGTH) {
			return;
		}

		elements.push(textBuffer);
		textBuffer = "";
	};

	while (index < text.length) {
		const code = tryReadCode(text, index);
		if (code) {
			flushBuffer();
			elements.push(
				<code
					className="rounded border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[12px] text-accent"
					key={`code-${String(index)}`}
				>
					{code.content}
				</code>,
			);
			index = code.nextIndex;
			continue;
		}

		const bold = tryReadBold(text, index);
		if (bold) {
			flushBuffer();
			elements.push(
				<strong
					className="font-semibold text-text"
					key={`bold-${String(index)}`}
				>
					{renderInlineMarkdown(bold.content)}
				</strong>,
			);
			index = bold.nextIndex;
			continue;
		}

		const italic = tryReadItalic(text, index);
		if (italic) {
			flushBuffer();
			elements.push(
				<em className="italic" key={`italic-${String(index)}`}>
					{renderInlineMarkdown(italic.content)}
				</em>,
			);
			index = italic.nextIndex;
			continue;
		}

		const strike = tryReadStrike(text, index);
		if (strike) {
			flushBuffer();
			elements.push(
				<del
					className="line-through opacity-75"
					key={`strike-${String(index)}`}
				>
					{renderInlineMarkdown(strike.content)}
				</del>,
			);
			index = strike.nextIndex;
			continue;
		}

		const link = tryReadLink(text, index);
		if (link) {
			flushBuffer();
			elements.push(
				<a
					className="font-medium text-accent underline hover:text-accent-hover"
					href={link.url}
					key={`link-${String(index)}`}
					rel="noopener noreferrer"
					target="_blank"
				>
					{link.label}
				</a>,
			);
			index = link.nextIndex;
			continue;
		}

		const char = text[index];
		if (char) {
			textBuffer += char;
		}
		index++;
	}

	flushBuffer();

	return elements;
};

const parseCodeBlock = (
	lines: string[],
	startIndex: number,
): ParseBlockResult<Extract<MarkdownBlock, { type: "code" }>> => {
	const firstLine = lines[startIndex] ?? "";
	const language = firstLine.trimStart().slice(CODE_PREFIX_LENGTH).trim();
	const codeLines: string[] = [];
	let index = startIndex + INDEX_OFFSET_ONE;

	while (index < lines.length && !isCodeBlockDelimiter(lines[index] ?? "")) {
		codeLines.push(lines[index] ?? "");
		index++;
	}

	const content = codeLines.join("\n");
	const block: Extract<MarkdownBlock, { type: "code" }> = language
		? { content, language, type: "code" }
		: { content, type: "code" };

	return {
		block,
		nextIndex: index + INDEX_OFFSET_ONE,
	};
};

const parseQuoteBlock = (
	lines: string[],
	startIndex: number,
): ParseBlockResult<Extract<MarkdownBlock, { type: "quote" }>> => {
	const quoteLines: string[] = [];
	let index = startIndex;

	while (index < lines.length && isQuoteLine(lines[index] ?? "")) {
		quoteLines.push((lines[index] ?? "").trimStart().replace(/^>\s?/, ""));
		index++;
	}

	return {
		block: {
			text: quoteLines.join("\n"),
			type: "quote",
		},
		nextIndex: index,
	};
};

const parseListBlock = (
	lines: string[],
	startIndex: number,
): ParseBlockResult<
	Extract<MarkdownBlock, { type: "ordered-list" | "unordered-list" }>
> => {
	const isOrdered = isOrderedListLine(lines[startIndex] ?? "");
	const matcher = isOrdered
		? ORDERED_LIST_ITEM_REGEX
		: UNORDERED_LIST_ITEM_REGEX;
	const items: string[] = [];
	let index = startIndex;

	while (index < lines.length && matcher.test(lines[index] ?? "")) {
		items.push((lines[index] ?? "").replace(matcher, "").trim());
		index++;
	}

	return {
		block: isOrdered
			? { items, type: "ordered-list" }
			: { items, type: "unordered-list" },
		nextIndex: index,
	};
};

const parseParagraphBlock = (
	lines: string[],
	startIndex: number,
): ParseBlockResult<Extract<MarkdownBlock, { type: "paragraph" }>> => {
	const paragraphLines: string[] = [];
	let index = startIndex;

	while (
		index < lines.length &&
		(lines[index] ?? "").trim().length > EMPTY_LENGTH &&
		!isSpecialBlockStart(lines[index] ?? "")
	) {
		paragraphLines.push((lines[index] ?? "").trim());
		index++;
	}

	return {
		block: {
			text: paragraphLines.join(" "),
			type: "paragraph",
		},
		nextIndex: index,
	};
};

const parseMarkdownBlocks = (markdown: string): MarkdownBlock[] => {
	const lines = markdown.split(/\r?\n/);
	const blocks: MarkdownBlock[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index] ?? "";

		if (line.trim().length === EMPTY_LENGTH) {
			index++;
			continue;
		}

		if (isDividerLine(line)) {
			blocks.push({ type: "divider" });
			index++;
			continue;
		}

		const heading = tryParseHeading(line);
		if (heading) {
			blocks.push(heading);
			index++;
			continue;
		}

		if (isCodeBlockDelimiter(line)) {
			const result = parseCodeBlock(lines, index);
			blocks.push(result.block);
			index = result.nextIndex;
			continue;
		}

		if (isQuoteLine(line)) {
			const result = parseQuoteBlock(lines, index);
			blocks.push(result.block);
			index = result.nextIndex;
			continue;
		}

		if (isUnorderedListLine(line) || isOrderedListLine(line)) {
			const result = parseListBlock(lines, index);
			blocks.push(result.block);
			index = result.nextIndex;
			continue;
		}

		const paragraph = parseParagraphBlock(lines, index);
		blocks.push(paragraph.block);
		index = paragraph.nextIndex;
	}

	return blocks;
};

type Properties = {
	content: string;
};

const MarkdownContent = ({ content }: Properties): JSX.Element => {
	const blocks = parseMarkdownBlocks(content);

	return (
		<div className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text">
			{blocks.map((block, blockIndex) => {
				switch (block.type) {
					case "code": {
						return (
							<div
								className="my-1.5 overflow-hidden rounded-lg border border-border bg-secondary/80 shadow-2xs"
								key={blockIndex}
							>
								{block.language && (
									<div className="border-b border-border/50 bg-secondary px-3 py-1 font-mono text-[11px] font-medium text-text-faint">
										{block.language}
									</div>
								)}
								<pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-text">
									<code>{block.content}</code>
								</pre>
							</div>
						);
					}
					case "divider": {
						return <hr className="my-2 border-border" key={blockIndex} />;
					}
					case "heading": {
						if (block.level === HEADING_LEVEL_1) {
							return (
								<h1
									className="mt-3 mb-1 font-sans text-base font-semibold text-text first:mt-0"
									key={blockIndex}
								>
									{renderInlineMarkdown(block.text)}
								</h1>
							);
						}
						if (block.level === HEADING_LEVEL_2) {
							return (
								<h2
									className="mt-2.5 mb-1 font-sans text-sm font-semibold text-text first:mt-0"
									key={blockIndex}
								>
									{renderInlineMarkdown(block.text)}
								</h2>
							);
						}
						if (block.level === HEADING_LEVEL_3) {
							return (
								<h3
									className="mt-2 mb-0.5 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted first:mt-0"
									key={blockIndex}
								>
									{renderInlineMarkdown(block.text)}
								</h3>
							);
						}
						return (
							<h4
								className="mt-1.5 mb-0.5 font-sans text-xs font-semibold text-text first:mt-0"
								key={blockIndex}
							>
								{renderInlineMarkdown(block.text)}
							</h4>
						);
					}
					case "ordered-list": {
						return (
							<ol
								className="my-1 list-decimal space-y-1 pl-5 font-sans text-sm leading-relaxed text-text"
								key={blockIndex}
							>
								{block.items.map((item, itemIndex) => (
									<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
								))}
							</ol>
						);
					}
					case "paragraph": {
						return (
							<p
								className="my-0.5 font-sans text-sm leading-relaxed text-text"
								key={blockIndex}
							>
								{renderInlineMarkdown(block.text)}
							</p>
						);
					}
					case "quote": {
						return (
							<blockquote
								className="my-1 border-l-2 border-accent/40 bg-accent/5 py-1.5 pl-3 pr-2 font-sans text-xs italic text-text-muted rounded-r"
								key={blockIndex}
							>
								{renderInlineMarkdown(block.text)}
							</blockquote>
						);
					}
					case "unordered-list": {
						return (
							<ul
								className="my-1 list-disc space-y-1 pl-5 font-sans text-sm leading-relaxed text-text"
								key={blockIndex}
							>
								{block.items.map((item, itemIndex) => (
									<li key={itemIndex}>{renderInlineMarkdown(item)}</li>
								))}
							</ul>
						);
					}
				}
			})}
		</div>
	);
};

export { MarkdownContent };
