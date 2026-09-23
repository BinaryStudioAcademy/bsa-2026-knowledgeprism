type Properties = {
	query: string;
	text: string;
};

const HighlightedText: React.FC<Properties> = ({ query, text }: Properties) => {
	const trimmedQuery = query.trim();

	if (!trimmedQuery) {
		return <>{text}</>;
	}

	const escapedQuery = trimmedQuery.replaceAll(
		/[.*+?^${}()|[\]\\]/g,
		String.raw`\$&`,
	);
	const segments = text.split(new RegExp(`(${escapedQuery})`, "iu"));

	return (
		<>
			{segments.map((segment, index) =>
				segment.toLowerCase() === trimmedQuery.toLowerCase() ? (
					<mark
						className="rounded-sm bg-accent/20 text-text"
						key={`${segment}-${String(index)}`}
					>
						{segment}
					</mark>
				) : (
					<span key={`${segment}-${String(index)}`}>{segment}</span>
				),
			)}
		</>
	);
};

export { HighlightedText };
