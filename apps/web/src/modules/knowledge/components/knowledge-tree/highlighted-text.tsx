import React from "react";

import {
	NOT_FOUND_INDEX,
	START_INDEX,
} from "../../libs/constants/constants.js";

type HighlightedTextProperties = {
	highlight?: string | undefined;
	text: string;
};

const HighlightedText: React.FC<HighlightedTextProperties> = ({
	highlight = "",
	text,
}: HighlightedTextProperties) => {
	const normalizedHighlight = highlight.trim();

	if (!normalizedHighlight) {
		return <span className="truncate">{text}</span>;
	}

	const matchIndex = text
		.toLowerCase()
		.indexOf(normalizedHighlight.toLowerCase());

	if (matchIndex === NOT_FOUND_INDEX) {
		return <span className="truncate">{text}</span>;
	}

	const beforeString = text.slice(START_INDEX, matchIndex);
	const matchString = text.slice(
		matchIndex,
		matchIndex + normalizedHighlight.length,
	);
	const afterString = text.slice(matchIndex + normalizedHighlight.length);

	return (
		<span className="truncate">
			{beforeString}
			<span className="bg-accent/20 text-accent">{matchString}</span>
			{afterString}
		</span>
	);
};

export { HighlightedText };
