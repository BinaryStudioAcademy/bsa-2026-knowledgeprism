import { type SvgIconProperties } from "../types.js";

const CloseIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 14 14" width={size}>
		<path
			d="M1 1l12 12M13 1L1 13"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

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

const LinkIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M8.5 11.5a3 3 0 0 0 4 .3l2-2a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
	</svg>
);

const PlusIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 3v14M3 10h14"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

const SearchIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
		<path
			d="M18 18l-4-4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

const SendIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 13.333 13.333" width={size}>
		<path d="M0 0l13.3 6.7L0 13.3l2.7-6.6z" fill="currentColor" />
	</svg>
);

export {
	CloseIcon,
	FilterIcon,
	HamburgerIcon,
	LinkIcon,
	PlusIcon,
	SearchIcon,
	SendIcon,
};
