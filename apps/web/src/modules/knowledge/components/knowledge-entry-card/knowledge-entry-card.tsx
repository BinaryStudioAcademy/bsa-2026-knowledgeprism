import { type KnowledgeEntry } from "../libs/types.js";

type Properties = {
	entry: KnowledgeEntry;
};

const KnowledgeEntryCard: React.FC<Properties> = ({ entry }: Properties) => (
	<div className="rounded-xl border border-border bg-surface px-5.5 py-5">
		<div className="mb-2.5 flex items-center justify-between gap-3">
			<h3 className="font-serif text-[19px] leading-[26px]">{entry.title}</h3>
			<span className="whitespace-nowrap rounded-[5px] bg-secondary px-2 py-0.75 font-mono text-[9.5px] font-medium tracking-[0.04em] text-text-muted">
				{entry.tag}
			</span>
		</div>
		<p className="mb-3.5 text-[14px] leading-[1.65] text-text">
			{entry.content}
		</p>
		<div className="flex gap-4.5 border-t border-border-subtle pt-3 font-mono text-xs text-text-faint">
			<span>Updated {entry.updatedLabel}</span>
			<span>By {entry.author}</span>
		</div>
	</div>
);

export { KnowledgeEntryCard };
