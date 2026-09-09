import { HERO_DEMO_PANEL } from "./libs/constants.js";

const HeroPreview: React.FC = () => (
	<div className="flex min-w-[340px] flex-1 justify-center">
		<div className="w-full max-w-[440px] overflow-hidden rounded-[14px] border border-border bg-surface shadow-[0_20px_48px_rgba(45,42,38,0.12)]">
			<div className="flex items-center justify-between border-b border-border-subtle px-[18px] py-3.5">
				<span className="text-[12.5px] text-text-muted">
					{HERO_DEMO_PANEL.BREADCRUMB}
				</span>
				<span className="flex items-center gap-1.5 text-[11.5px] text-accent">
					<span className="inline-block size-1.5 rounded-full bg-accent" />
					{HERO_DEMO_PANEL.BADGE}
				</span>
			</div>

			<div className="px-[18px] py-5">
				<h3 className="mb-3.5 font-serif text-[19px] font-normal text-text">
					{HERO_DEMO_PANEL.TITLE}
				</h3>

				<div className="mb-[18px] flex gap-2.5">
					<div className="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5">
						<p className="text-[9.5px] font-medium uppercase text-text-faint">
							{HERO_DEMO_PANEL.STAT_LEFT.LABEL}
						</p>
						<p className="mt-0.5 text-[13.5px] font-medium text-text">
							{HERO_DEMO_PANEL.STAT_LEFT.VALUE}
						</p>
					</div>
					<div className="flex-1 rounded-lg border border-border bg-bg px-3 py-2.5">
						<p className="text-[9.5px] font-medium uppercase text-text-faint">
							{HERO_DEMO_PANEL.STAT_RIGHT.LABEL}
						</p>
						<p className="mt-0.5 text-[13.5px] font-medium text-text">
							{HERO_DEMO_PANEL.STAT_RIGHT.VALUE}
						</p>
					</div>
				</div>

				<div className="border-t border-border-subtle pt-4">
					<div className="mb-2.5 flex justify-end">
						<span className="max-w-[78%] rounded-[12px_12px_3px_12px] bg-primary px-[13px] py-2 text-[12.5px] text-primary-fg">
							{HERO_DEMO_PANEL.QUESTION}
						</span>
					</div>
					<div className="flex gap-2">
						<span className="size-5 shrink-0 rounded-md bg-accent" />
						<p className="text-[12.5px] leading-[1.5] text-text">
							{HERO_DEMO_PANEL.ANSWER}{" "}
							<span className="inline-flex rounded-full bg-success-bg px-1.5 py-0.5 text-[10.5px] font-medium text-accent">
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
