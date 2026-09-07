import { type SvgIconProperties } from "../types.js";

const GlossaryIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 6c-1.6-1.2-4-1.7-6.5-1.3v10c2.5-.4 4.9.1 6.5 1.3 1.6-1.2 4-1.7 6.5-1.3v-10C14 4.3 11.6 4.8 10 6z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
		<path d="M10 6v10" stroke="currentColor" strokeWidth="1.3" />
	</svg>
);

export { GlossaryIcon };
