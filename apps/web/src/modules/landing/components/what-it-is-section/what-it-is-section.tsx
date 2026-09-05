import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { KnowledgeTreePreview } from "./knowledge-tree-preview.js";
import {
	WHAT_IT_IS_SECTION_CLASS,
	WHAT_IT_IS_SECTION_COPY,
} from "./libs/constants.js";

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
