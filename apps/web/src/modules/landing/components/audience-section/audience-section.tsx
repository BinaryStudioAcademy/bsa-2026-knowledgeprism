import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { AUDIENCE_SECTION_COPY, AUDIENCES } from "./libs/constants.js";

const AUDIENCE_SECTION_CLASS = {
	BODY: "text-[13.5px] leading-[1.6] text-text-muted",
	CARD: "rounded-2xl border border-border bg-surface p-[clamp(28px,4vw,48px)]",
	COLUMN: "min-w-[220px] flex-1",
	GRID: "mt-5 flex flex-wrap gap-10",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} pb-[clamp(64px,9vw,120px)] pt-0`,
	TITLE: "mb-1.5 text-base font-medium text-text",
} as const;

type Audience = (typeof AUDIENCES)[number];

const AudienceCard: React.FC<Audience> = ({ body, title }: Audience) => (
	<div className={AUDIENCE_SECTION_CLASS.COLUMN}>
		<h3 className={AUDIENCE_SECTION_CLASS.TITLE}>{title}</h3>
		<p className={AUDIENCE_SECTION_CLASS.BODY}>{body}</p>
	</div>
);

const AudienceSection: React.FC = () => (
	<section className={AUDIENCE_SECTION_CLASS.ROOT}>
		<div className={AUDIENCE_SECTION_CLASS.CARD}>
			<SectionEyebrow>{AUDIENCE_SECTION_COPY.eyebrow}</SectionEyebrow>
			<div className={AUDIENCE_SECTION_CLASS.GRID}>
				{AUDIENCES.map((audience) => (
					<AudienceCard key={audience.title} {...audience} />
				))}
			</div>
		</div>
	</section>
);

export { AudienceSection };
