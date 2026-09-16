import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { FOOTER_COPY } from "./libs/constants.js";

const FOOTER_FOCUS_RING =
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35";
const FOOTER_CONTAINER_CLASS =
	"mx-auto max-w-[1240px] px-[clamp(20px,5vw,40px)]";

const Footer: React.FC = () => (
	<footer className="border-t border-border">
		<div
			className={getValidClassNames(
				FOOTER_CONTAINER_CLASS,
				"flex flex-wrap items-center justify-between gap-3 py-7",
			)}
		>
			<span
				className={getValidClassNames(
					"order-2 font-mono text-[12px] text-text-faint",
					"tablet:order-none",
				)}
			>
				{FOOTER_COPY.copyright}
			</span>
			<nav
				aria-label="Footer"
				className={getValidClassNames(
					"order-1 flex gap-6",
					"tablet:order-none",
				)}
			>
				{FOOTER_COPY.links.map((link) => (
					<a
						className={getValidClassNames(
							"rounded-sm text-[12.5px] text-text-muted",
							FOOTER_FOCUS_RING,
						)}
						href={link.href}
						key={link.label}
					>
						{link.label}
					</a>
				))}
			</nav>
		</div>
	</footer>
);

export { Footer };
