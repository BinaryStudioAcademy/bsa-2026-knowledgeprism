import { type SvgIconProperties } from "../types.js";

const BellIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2a5 5 0 0 0-5 5v3.5l-1.5 3h13L15 10.5V7a5 5 0 0 0-5-5z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
		<path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const CheckboxTickIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 10.867 8.017" width={size}>
		<path
			d="M1 4l3 3 5.5-6.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
		/>
	</svg>
);

const ShieldIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2l7 4v5c0 4-3 6.5-7 7.5-4-1-7-3.5-7-7.5V6z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const ToastCheckIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M4 10.5l4 4L16 6"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		/>
	</svg>
);

export { BellIcon, CheckboxTickIcon, ShieldIcon, ToastCheckIcon };
