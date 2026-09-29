import { type JSX, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Properties = {
	content: string;
};

const LANGUAGE_REGEX = /language-(\w+)/;
const LANGUAGE_INDEX = 1;

const MARKDOWN_COMPONENTS: Components = {
	a: ({ children, href }) => (
		<a
			className="font-medium text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
		</a>
	),
	blockquote: ({ children }) => (
		<blockquote className="my-1 rounded-r border-l-2 border-accent/40 bg-accent/5 py-1.5 pl-3 pr-2 font-sans text-xs italic text-text-muted">
			{children}
		</blockquote>
	),
	code: ({ children, className, ...rest }) => {
		const match = LANGUAGE_REGEX.exec(className ?? "");
		const language = match?.[LANGUAGE_INDEX];
		const isBlockCode =
			Boolean(language) ||
			(typeof children === "string" && children.includes("\n"));

		if (isBlockCode) {
			return (
				<div className="my-2 overflow-hidden rounded-lg border border-border bg-surface">
					{language && (
						<div className="border-b border-border/50 bg-secondary px-3 py-1 font-mono text-[11px] font-medium text-text-faint">
							{language}
						</div>
					)}
					<pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-text">
						<code>{children}</code>
					</pre>
				</div>
			);
		}

		return (
			<code
				className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-xs text-accent"
				{...rest}
			>
				{children}
			</code>
		);
	},
	del: ({ children }) => (
		<del className="text-text-muted line-through">{children}</del>
	),
	em: ({ children }) => <em className="italic">{children}</em>,
	h1: ({ children }) => (
		<h1 className="mt-3 mb-1 font-sans text-base font-semibold text-text first:mt-0">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="mt-2.5 mb-1 font-sans text-sm font-semibold text-text first:mt-0">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="mt-2 mb-0.5 font-sans text-xs font-semibold uppercase tracking-wider text-text-muted first:mt-0">
			{children}
		</h3>
	),
	h4: ({ children }) => (
		<h4 className="mt-1.5 mb-0.5 font-sans text-xs font-semibold text-text first:mt-0">
			{children}
		</h4>
	),
	hr: () => <hr className="my-2 border-border" />,
	ol: ({ children }) => (
		<ol className="my-1 list-decimal space-y-1 pl-5 font-sans text-sm leading-relaxed text-text">
			{children}
		</ol>
	),
	p: ({ children }) => (
		<p className="my-0.5 font-sans text-sm leading-relaxed text-text">
			{children}
		</p>
	),
	pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
	strong: ({ children }) => (
		<strong className="font-semibold text-text">{children}</strong>
	),
	ul: ({ children }) => (
		<ul className="my-1 list-disc space-y-1 pl-5 font-sans text-sm leading-relaxed text-text">
			{children}
		</ul>
	),
};

const REMARK_PLUGINS = [remarkGfm];

const MarkdownContent = ({ content }: Properties): JSX.Element => {
	return (
		<div className="flex flex-col gap-1.5">
			<Markdown components={MARKDOWN_COMPONENTS} remarkPlugins={REMARK_PLUGINS}>
				{content}
			</Markdown>
		</div>
	);
};

export { MarkdownContent };
