import { type SvgIconProperties } from "../types.js";

const FileSharpIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 14;
	const height = 16;

	return (
		<svg
			fill="none"
			height={size}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={(size * width) / height}
		>
			<path d="M2 1h7l3 3v11H2z" stroke="currentColor" strokeWidth="1.2" />
		</svg>
	);
};

export { FileSharpIcon };
