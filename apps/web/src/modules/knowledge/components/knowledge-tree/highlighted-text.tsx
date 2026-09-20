import React from "react";

import { NOT_FOUND_INDEX, START_INDEX } from "./constants.js";

type HighlightedTextProperties = {
	highlight?: string | undefined;
	text: string;
};

const HighlightedText: React.FC<HighlightedTextProperties> = ({
	highlight = "",
	text,
}: HighlightedTextProperties) => {
	if (!highlight) {
		return <span className="truncate">{text}</span>;
	}

	const matchIndex = text.toLowerCase().indexOf(highlight.toLowerCase());

	if (matchIndex === NOT_FOUND_INDEX) {
		return <span className="truncate">{text}</span>;
	}

	const beforeString = text.slice(START_INDEX, matchIndex);
	const matchString = text.slice(matchIndex, matchIndex + highlight.length);
	const afterString = text.slice(matchIndex + highlight.length);

	return (
		<span className="truncate">
			{beforeString}
			<span className="bg-accent/20 text-accent">{matchString}</span>
			{afterString}
		</span>
	);
};

export { HighlightedText };
