import { type SvgIconProperties } from "../types.js";

const ChevronFilledDownIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 12;
	const height = 7.4;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={size}
		>
			<path d="M0 0l6 7.4L12 0z" fill="currentColor" />
		</svg>
	);
};

export { ChevronFilledDownIcon };
