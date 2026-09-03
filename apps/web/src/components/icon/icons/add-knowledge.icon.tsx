import { type SvgIconProperties } from "../types.js";

const AddKnowledgeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 8.167 8.167" width={size}>
		<path d="M3.6 0h1v3.6H8.2v1H4.6v3.6h-1V4.6H0v-1h3.6z" fill="currentColor" />
	</svg>
);

export { AddKnowledgeIcon };
