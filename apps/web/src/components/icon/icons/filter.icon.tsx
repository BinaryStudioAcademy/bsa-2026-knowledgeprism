import { type SvgIconProperties } from "../types.js";

const FilterIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 13.5;
	const height = 9;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={size}
		>
			<path d="M0 0h13.5L8.5 5.5v3h-3v-3z" fill="currentColor" />
		</svg>
	);
};

export { FilterIcon };
