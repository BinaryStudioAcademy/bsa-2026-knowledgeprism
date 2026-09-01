import { type SvgIconProperties } from "../types.js";

const ApertureExpandedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17M5.3 5.3l1.5 1.5M13.2 13.2l1.5 1.5M5.3 14.7l1.5-1.5M13.2 6.8l1.5-1.5"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const ApertureIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const BulletPointIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" fill="currentColor" r="3" />
	</svg>
);

const HexagonNodeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M10 2l7 4v8l-7 4-7-4V6z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const ParagraphIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 3h14M3 8h14M3 13h10M3 18h10"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const SquarePlaceholderIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

export {
	ApertureExpandedIcon,
	ApertureIcon,
	BulletPointIcon,
	HexagonNodeIcon,
	ParagraphIcon,
	SquarePlaceholderIcon,
};
