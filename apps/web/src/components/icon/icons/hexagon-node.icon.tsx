import { type SvgIconProperties } from "../types.js";

const HexagonNodeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M10 2l7 4v8l-7 4-7-4V6z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

export { HexagonNodeIcon };
