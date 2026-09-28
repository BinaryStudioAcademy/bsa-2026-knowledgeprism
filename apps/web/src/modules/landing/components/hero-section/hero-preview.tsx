import { Icon } from "~/components/icon/icon.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_FLEX_COLUMN_CLASS } from "~/modules/landing/libs/constants.js";

import {
	HERO_AVATAR_ICON_SIZE,
	HERO_DEMO_PANEL,
	HERO_PREVIEW_ICON_SIZE,
	HERO_SOURCE_ICON_SIZE,
	HERO_TREE_SECTIONS,
} from "./libs/constants.js";

const EMPTY_LENGTH = 0;

const HeroPreview: React.FC = () => (
	<div
		className={getValidClassNames(
			LANDING_FLEX_COLUMN_CLASS,
			"mobile:min-w-[320px]",
		)}
	>
		<div className="relative ml-auto w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-surface">
			<div className="border-b border-border-subtle px-4 py-3 text-[12.5px] font-medium">
				{HERO_DEMO_PANEL.TITLE}
			</div>
			<div className="flex flex-col gap-1.5 px-4 py-3 pb-52">
				{HERO_TREE_SECTIONS.map((section) => (
					<div key={section.title}>
						<div className="flex items-center gap-2 text-[13px] text-text-muted">
							<Icon name="folder" size={HERO_PREVIEW_ICON_SIZE} />
							{section.title}
						</div>
						{section.pages.length > EMPTY_LENGTH && (
							<div className="mt-1 flex flex-col gap-1 pl-5">
								{section.pages.map((page) => (
									<div
										className={getValidClassNames(
											"rounded-md px-2 py-1.5 text-[13px]",
											section.selectedPage === page
												? "bg-border-subtle font-medium text-text"
												: "text-text-muted",
										)}
										key={`${section.title}-${page}`}
									>
										{page}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			<div className="absolute right-3 bottom-3 w-[min(calc(100%-1.5rem),280px)] rounded-xl border border-border bg-surface p-2.5">
				<p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-text-faint">
					Ask Prism
				</p>
				<div className="mb-2 flex justify-end">
					<span className="max-w-[95%] rounded-[10px_10px_3px_10px] bg-primary px-2 py-1.5 text-[10.5px] leading-[1.4] text-primary-fg">
						{HERO_DEMO_PANEL.QUESTION}
					</span>
				</div>
				<div className="flex gap-1.5">
					<span className="flex size-[18px] shrink-0 items-center justify-center rounded-md bg-accent text-white">
						<Icon name="prism" size={HERO_AVATAR_ICON_SIZE} />
					</span>
					<div className="min-w-0">
						<p className="text-[10.5px] leading-[1.45] text-text">
							{HERO_DEMO_PANEL.ANSWER}
						</p>
						<span className="mt-1.5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-accent/20 bg-success-bg px-1.5 py-0.5 text-[10px] font-medium text-accent">
							<Icon name="file" size={HERO_SOURCE_ICON_SIZE} />
							<span>{HERO_DEMO_PANEL.SOURCE_TITLE}</span>
							<span className="opacity-60">·</span>
							<span>{HERO_DEMO_PANEL.SOURCE_SECTION}</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
);

export { HeroPreview };
