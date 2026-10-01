import { type JSX } from "react";

import { Button } from "~/components/components.js";
import { type ProposedSection } from "~/modules/knowledge/libs/types/types.js";

const POSITION_OFFSET = 1;
const NO_SECTIONS = 0;
const FIRST_POSITION = 0;

type SectionNavigatorProperties = {
	currentPosition: number;
	isDisabled: boolean;
	onDone: () => void;
	onNext: () => void;
	onPrevious: () => void;
	total: number;
};

type SectionPosition = {
	pageIndex: number;
	sectionIndex: number;
};

const toSectionPositions = (pages: ProposedSection[]): SectionPosition[] =>
	pages.flatMap((page, pageIndex) =>
		page.pages.map((_section, sectionIndex) => ({ pageIndex, sectionIndex })),
	);

const SectionNavigator = ({
	currentPosition,
	isDisabled,
	onDone,
	onNext,
	onPrevious,
	total,
}: SectionNavigatorProperties): JSX.Element => (
	<div
		aria-label="Section navigation"
		className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-white px-3 py-2 shadow-lg"
		role="toolbar"
	>
		<Button
			disabled={isDisabled || currentPosition <= FIRST_POSITION}
			onClick={onPrevious}
			variant="secondary"
		>
			‹ Previous section
		</Button>
		<span
			aria-live="polite"
			className="font-mono text-xs text-text-muted whitespace-nowrap"
		>
			{currentPosition + POSITION_OFFSET} / {total}
		</span>
		<Button
			disabled={
				isDisabled ||
				total === NO_SECTIONS ||
				currentPosition >= total - POSITION_OFFSET
			}
			onClick={onNext}
			variant="secondary"
		>
			Next section ›
		</Button>
		<Button disabled={isDisabled} onClick={onDone} variant="primary">
			Done
		</Button>
	</div>
);

export { SectionNavigator, toSectionPositions };
