import { GlossaryTermOrigin } from "@knowledgeprism/constants";
import { type GlossaryTermItemDto } from "@knowledgeprism/types";

import { useCallback } from "~/hooks/hooks.js";

import { AiTermBadge } from "../ai-term-badge/ai-term-badge.js";

type Properties = {
	onSelect: (id: number) => void;
	term: GlossaryTermItemDto;
};

const GlossaryTermCard: React.FC<Properties> = ({
	onSelect,
	term,
}: Properties) => {
	const handleClick = useCallback((): void => {
		onSelect(term.id);
	}, [onSelect, term.id]);

	return (
		<button
			className="w-full cursor-pointer rounded-xl border border-border bg-surface px-5.5 py-5 text-left transition-colors hover:border-text-faint focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35"
			onClick={handleClick}
			type="button"
		>
			<div className="mb-2 flex items-start justify-between gap-3">
				<h3 className="break-words font-serif text-[19px] leading-[26px] text-text">
					{term.name}
				</h3>
				{term.origin === GlossaryTermOrigin.AI && <AiTermBadge />}
			</div>
			<p className="line-clamp-2 break-words text-[14px] leading-[1.65] text-text-muted">
				{term.definition}
			</p>
		</button>
	);
};

export { GlossaryTermCard };
