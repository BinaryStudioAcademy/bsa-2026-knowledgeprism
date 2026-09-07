import { type SvgIconProperties } from "../types.js";

const ChevronFilledRightIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 4.317;
	const height = 7;

	return (
		<svg
			fill="none"
			height={size}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={(size * width) / height}
		>
			<path d="M0 0l4.3 3.5L0 7z" fill="currentColor" />
		</svg>
	);
};

export { ChevronFilledRightIcon };
