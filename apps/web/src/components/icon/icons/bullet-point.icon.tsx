import { type SvgIconProperties } from "../types.js";

const BulletPointIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" fill="currentColor" r="3" />
	</svg>
);

export { BulletPointIcon };
