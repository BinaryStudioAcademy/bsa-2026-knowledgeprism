import { type SvgIconProperties } from "../types.js";

const ProjectIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2l6 3.5v9L10 18l-6-3.5v-9z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

export { ProjectIcon };
