import { type JSX } from "react";

import { Icon } from "~/components/components.js";

const PrismAvatar = (): JSX.Element => (
	<div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-white shadow-2xs transition-transform duration-200">
		<Icon name="prism" size={14} />
	</div>
);

export { PrismAvatar };
