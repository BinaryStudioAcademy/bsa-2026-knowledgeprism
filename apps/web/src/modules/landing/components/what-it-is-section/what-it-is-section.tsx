import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { KnowledgeTreePreview } from "./knowledge-tree-preview.js";
import { WHAT_IT_IS_SECTION_COPY } from "./libs/constants.js";

const WhatItIsSection: React.FC = () => (
	<section
		className={getValidClassNames(
			LANDING_SECTION_CONTAINER_CLASS,
			"flex flex-wrap items-center gap-x-16 gap-y-8 py-[clamp(64px,9vw,120px)]",
		)}
		id="what"
	>
		<KnowledgeTreePreview />
		<div className="min-w-[320px] flex-1">
			<SectionEyebrow>{WHAT_IT_IS_SECTION_COPY.eyebrow}</SectionEyebrow>
			<h2 className="mb-4 mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text">
				{WHAT_IT_IS_SECTION_COPY.heading}
			</h2>
			<p className="max-w-[440px] text-[15.5px] leading-[1.7] text-text-muted">
				{WHAT_IT_IS_SECTION_COPY.body}
			</p>
		</div>
	</section>
);

export { WhatItIsSection };
