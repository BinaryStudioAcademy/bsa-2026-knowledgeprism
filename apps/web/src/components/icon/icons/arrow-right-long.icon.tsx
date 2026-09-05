import { type SvgIconProperties } from "../types.js";

const ArrowRightLongIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 20;
	const height = 12;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={size}
		>
			<path
				d="M0 6h18M13 1l5 5-5 5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="1.6"
			/>
		</svg>
	);
};

export { ArrowRightLongIcon };
