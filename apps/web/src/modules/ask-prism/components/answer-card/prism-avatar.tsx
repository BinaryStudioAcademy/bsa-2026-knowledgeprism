import { type JSX } from "react";

const PrismAvatar = (): JSX.Element => (
	<div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-white shadow-2xs transition-transform duration-200">
		<svg fill="none" height="14" viewBox="0 0 44 44" width="14">
			<polygon fill="rgba(255,255,255,.6)" points="22,4 22,40 4,40" />
			<polygon fill="#fff" points="22,4 40,40 22,40" />
		</svg>
	</div>
);

export { PrismAvatar };
