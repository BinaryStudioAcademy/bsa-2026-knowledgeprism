import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { AUDIENCE_SECTION_COPY, AUDIENCES } from "./libs/constants.js";

type Audience = (typeof AUDIENCES)[number];

const AudienceCard: React.FC<Audience> = ({ body, title }: Audience) => (
	<div className="min-w-[220px] flex-1">
		<h3 className="mb-1.5 text-base font-medium text-text">{title}</h3>
		<p className="text-[13.5px] leading-[1.6] text-text-muted">{body}</p>
	</div>
);

const AudienceSection: React.FC = () => (
	<section
		className={getValidClassNames(
			LANDING_SECTION_CONTAINER_CLASS,
			"pb-[clamp(64px,9vw,120px)] pt-0",
		)}
	>
		<div className="rounded-2xl border border-border bg-surface p-[clamp(28px,4vw,48px)]">
			<SectionEyebrow>{AUDIENCE_SECTION_COPY.eyebrow}</SectionEyebrow>
			<div className="mt-5 flex flex-wrap gap-10">
				{AUDIENCES.map((audience) => (
					<AudienceCard key={audience.title} {...audience} />
				))}
			</div>
		</div>
	</section>
);

export { AudienceSection };
