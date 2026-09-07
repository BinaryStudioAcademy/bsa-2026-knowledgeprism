import { type SvgIconProperties } from "../types.js";

const FolderIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 16;
	const height = 13;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox={`0 0 ${String(width)} ${String(height)}`}
			width={size}
		>
			<path
				d="M1 3a1 1 0 0 1 1-1h4l1.5 2H14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"
				stroke="currentColor"
				strokeWidth="1.2"
			/>
		</svg>
	);
};

export { FolderIcon };
