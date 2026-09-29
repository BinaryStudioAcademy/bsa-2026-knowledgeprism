import { type SvgIconProperties } from "../types.js";

const DragHandleIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 14 14" width={size}>
		<circle cx="4.5" cy="2.5" fill="currentColor" r="1.15" />
		<circle cx="4.5" cy="7" fill="currentColor" r="1.15" />
		<circle cx="4.5" cy="11.5" fill="currentColor" r="1.15" />
		<circle cx="9.5" cy="2.5" fill="currentColor" r="1.15" />
		<circle cx="9.5" cy="7" fill="currentColor" r="1.15" />
		<circle cx="9.5" cy="11.5" fill="currentColor" r="1.15" />
	</svg>
);

export { DragHandleIcon };
