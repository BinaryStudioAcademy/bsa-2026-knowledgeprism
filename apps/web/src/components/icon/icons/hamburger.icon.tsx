import { type SvgIconProperties } from "../types.js";

const HamburgerIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 18;
	const height = 12;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={size}
		>
			<path
				d="M0 1h18M0 6h18M0 11h18"
				stroke="currentColor"
				strokeWidth="1.4"
			/>
		</svg>
	);
};

export { HamburgerIcon };
