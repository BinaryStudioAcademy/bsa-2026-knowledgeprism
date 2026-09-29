import { type GlossaryTermItemDto } from "@knowledgeprism/types";
import { tv } from "tailwind-variants";

import { useCallback } from "~/hooks/hooks.js";

const optionStyles = tv({
	base: [
		"rounded-full border px-3 py-1 font-sans text-[13px] transition-colors",
		"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
		"cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
	],
	variants: {
		isSelected: {
			false: "border-border bg-surface text-text hover:border-text-faint",
			true: "border-accent bg-accent text-primary-fg",
		},
	},
});

type Properties = {
	isDisabled: boolean;
	isSelected: boolean;
	onToggle: (id: number) => void;
	term: GlossaryTermItemDto;
};

const RelatedTermOption: React.FC<Properties> = ({
	isDisabled,
	isSelected,
	onToggle,
	term,
}: Properties) => {
	const handleClick = useCallback((): void => {
		onToggle(term.id);
	}, [onToggle, term.id]);

	return (
		<button
			aria-pressed={isSelected}
			className={optionStyles({ isSelected })}
			disabled={isDisabled}
			onClick={handleClick}
			type="button"
		>
			{term.name}
		</button>
	);
};

export { RelatedTermOption };
