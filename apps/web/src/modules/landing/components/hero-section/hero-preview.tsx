import { HERO_DEMO_PANEL, HERO_DEMO_PANEL_CLASS } from "./libs/constants.js";

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
