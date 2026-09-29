import { type GlossaryRelatedTermDto } from "@knowledgeprism/types";

import { useCallback } from "~/hooks/hooks.js";

type Properties = {
	onSelect: (id: number) => void;
	term: GlossaryRelatedTermDto;
};

const RelatedTermChip: React.FC<Properties> = ({
	onSelect,
	term,
}: Properties) => {
	const handleClick = useCallback((): void => {
		onSelect(term.id);
	}, [onSelect, term.id]);

	return (
		<button
			className="cursor-pointer rounded-full border border-border bg-secondary px-3 py-1 font-sans text-[13px] text-text transition-colors hover:border-text-faint focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35"
			onClick={handleClick}
			type="button"
		>
			{term.name}
		</button>
	);
};

export { RelatedTermChip };
