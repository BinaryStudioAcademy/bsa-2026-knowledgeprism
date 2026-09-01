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

const ChevronDownIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 7.5l5 5 5-5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

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

const ChevronFilledUpIcon: React.FC<SvgIconProperties> = ({
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
			<path d="M0 7.4L6 0l6 7.4z" fill="currentColor" />
		</svg>
	);
};

export {
	ArrowRightLongIcon,
	ChevronDownIcon,
	ChevronFilledDownIcon,
	ChevronFilledRightIcon,
	ChevronFilledUpIcon,
};
