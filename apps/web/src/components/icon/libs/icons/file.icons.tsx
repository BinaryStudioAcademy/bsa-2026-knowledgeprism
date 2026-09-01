import { type SvgIconProperties } from "../types.js";

const AddKnowledgeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 8.167 8.167" width={size}>
		<path d="M3.6 0h1v3.6H8.2v1H4.6v3.6h-1V4.6H0v-1h3.6z" fill="currentColor" />
	</svg>
);

const FileIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<rect
			height="16"
			rx="1.5"
			stroke="currentColor"
			strokeWidth="1.3"
			width="12"
			x="4"
			y="2"
		/>
	</svg>
);

const FileRoundedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 2.5h7l3 3v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

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

const PasteTextIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 4h14M3 9h14M3 14h9"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

const UploadIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 13V3M6 7l4-4 4 4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<path
			d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</svg>
);

export {
	AddKnowledgeIcon,
	FileIcon,
	FileRoundedIcon,
	FileSharpIcon,
	FolderIcon,
	PasteTextIcon,
	UploadIcon,
};
