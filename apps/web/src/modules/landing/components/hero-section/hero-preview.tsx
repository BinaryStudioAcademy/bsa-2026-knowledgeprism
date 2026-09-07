import { HERO_DEMO_PANEL } from "./libs/constants.js";

const HERO_DEMO_PANEL_CLASS = {
	ANSWER: "text-[12.5px] leading-[1.5] text-text",
	ANSWER_ROW: "flex gap-2",
	AVATAR: "size-5 shrink-0 rounded-md bg-accent",
	BADGE: "flex items-center gap-1.5 text-[11.5px] text-accent",
	BADGE_DOT: "inline-block size-1.5 rounded-full bg-accent",
	BODY: "px-[18px] py-5",
	BREADCRUMB: "text-[12.5px] text-text-muted",
	BUBBLE:
		"max-w-[78%] rounded-[12px_12px_3px_12px] bg-primary px-[13px] py-2 text-[12.5px] text-primary-fg",
	CHROME:
		"flex items-center justify-between border-b border-border-subtle px-[18px] py-3.5",
	PREVIEW: "flex min-w-[340px] flex-1 justify-center",
	QUESTION_ROW: "mb-2.5 flex justify-end",
	ROOT: "w-full max-w-[440px] overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_20px_48px_rgba(45,42,38,0.12)]",
	STAT_BOX: "flex-1 rounded-lg border border-border bg-bg px-3 py-2.5",
	STAT_LABEL: "text-[9.5px] font-medium uppercase text-text-faint",
	STAT_ROW: "mb-[18px] flex gap-2.5",
	STAT_VALUE: "mt-0.5 text-[13.5px] font-medium text-text",
	TAG: "inline-flex rounded-full bg-success-bg px-1.5 py-0.5 text-[10.5px] font-medium text-accent",
	THREAD: "border-t border-border-subtle pt-4",
	TITLE: "mb-3.5 font-serif text-[19px] font-normal text-text",
} as const;

const HeroPreview: React.FC = () => (
	<div className={HERO_DEMO_PANEL_CLASS.PREVIEW}>
		<div className={HERO_DEMO_PANEL_CLASS.ROOT}>
			<div className={HERO_DEMO_PANEL_CLASS.CHROME}>
				<span className={HERO_DEMO_PANEL_CLASS.BREADCRUMB}>
					{HERO_DEMO_PANEL.BREADCRUMB}
				</span>
				<span className={HERO_DEMO_PANEL_CLASS.BADGE}>
					<span className={HERO_DEMO_PANEL_CLASS.BADGE_DOT} />
					{HERO_DEMO_PANEL.BADGE}
				</span>
			</div>

			<div className={HERO_DEMO_PANEL_CLASS.BODY}>
				<h3 className={HERO_DEMO_PANEL_CLASS.TITLE}>{HERO_DEMO_PANEL.TITLE}</h3>

				<div className={HERO_DEMO_PANEL_CLASS.STAT_ROW}>
					<div className={HERO_DEMO_PANEL_CLASS.STAT_BOX}>
						<p className={HERO_DEMO_PANEL_CLASS.STAT_LABEL}>
							{HERO_DEMO_PANEL.STAT_LEFT.LABEL}
						</p>
						<p className={HERO_DEMO_PANEL_CLASS.STAT_VALUE}>
							{HERO_DEMO_PANEL.STAT_LEFT.VALUE}
						</p>
					</div>
					<div className={HERO_DEMO_PANEL_CLASS.STAT_BOX}>
						<p className={HERO_DEMO_PANEL_CLASS.STAT_LABEL}>
							{HERO_DEMO_PANEL.STAT_RIGHT.LABEL}
						</p>
						<p className={HERO_DEMO_PANEL_CLASS.STAT_VALUE}>
							{HERO_DEMO_PANEL.STAT_RIGHT.VALUE}
						</p>
					</div>
				</div>

				<div className={HERO_DEMO_PANEL_CLASS.THREAD}>
					<div className={HERO_DEMO_PANEL_CLASS.QUESTION_ROW}>
						<span className={HERO_DEMO_PANEL_CLASS.BUBBLE}>
							{HERO_DEMO_PANEL.QUESTION}
						</span>
					</div>
					<div className={HERO_DEMO_PANEL_CLASS.ANSWER_ROW}>
						<span className={HERO_DEMO_PANEL_CLASS.AVATAR} />
						<p className={HERO_DEMO_PANEL_CLASS.ANSWER}>
							{HERO_DEMO_PANEL.ANSWER}{" "}
							<span className={HERO_DEMO_PANEL_CLASS.TAG}>
								{HERO_DEMO_PANEL.TAG}
							</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
);

export { HeroPreview };
