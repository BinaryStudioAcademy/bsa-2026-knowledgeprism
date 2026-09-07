import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { KnowledgeTreePreview } from "./knowledge-tree-preview.js";
import { WHAT_IT_IS_SECTION_COPY } from "./libs/constants.js";

const WHAT_IT_IS_SECTION_CLASS = {
	BODY: "max-w-[440px] text-[15.5px] leading-[1.7] text-text-muted",
	COPY: "min-w-[320px] flex-1",
	HEADING:
		"mb-4 mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center gap-x-16 gap-y-8 py-[clamp(64px,9vw,120px)]`,
} as const;

const WhatItIsSection: React.FC = () => (
	<section className={WHAT_IT_IS_SECTION_CLASS.ROOT} id="what">
		<KnowledgeTreePreview />
		<div className={WHAT_IT_IS_SECTION_CLASS.COPY}>
			<SectionEyebrow>{WHAT_IT_IS_SECTION_COPY.eyebrow}</SectionEyebrow>
			<h2 className={WHAT_IT_IS_SECTION_CLASS.HEADING}>
				{WHAT_IT_IS_SECTION_COPY.heading}
			</h2>
			<p className={WHAT_IT_IS_SECTION_CLASS.BODY}>
				{WHAT_IT_IS_SECTION_COPY.body}
			</p>
		</div>
	</section>
);

export { WhatItIsSection };
