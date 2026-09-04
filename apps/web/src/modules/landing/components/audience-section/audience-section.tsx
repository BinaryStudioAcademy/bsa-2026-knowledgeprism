import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import {
	AUDIENCE_SECTION_CLASS,
	AUDIENCE_SECTION_COPY,
	AUDIENCES,
} from "./libs/constants.js";

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
