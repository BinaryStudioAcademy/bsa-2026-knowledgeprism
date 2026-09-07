import { Icon } from "~/components/icon/icon.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	FEATURE_EXTRACT_ARROW_ICON_SIZE,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_SEARCH_BAR_ICON_SIZE,
	FEATURES_LIST,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

const FEATURE_PREVIEW_CLASS = {
	EXTRACT: {
		ARROW: "shrink-0 text-accent",
		LABEL: "font-medium text-[9.5px] uppercase text-accent",
		RAW: "w-[90px] rounded-md border border-border bg-surface p-3 text-center text-[11px] text-text-faint",
		RESULT: "flex-1 rounded-md border border-accent bg-success-bg p-3",
		ROOT: "flex w-full max-w-[340px] items-center gap-3.5",
		VALUE: "mt-0.5 text-[13px] font-medium text-text",
	},
	GLOSSARY: {
		BODY: "text-[13px] leading-[1.6] text-text-muted",
		HEADER: "mb-2 flex justify-between",
		ROOT: "w-full max-w-[340px] rounded-[10px] border border-border bg-surface p-[18px]",
		TAG: "rounded-[5px] bg-border-subtle px-2 py-[3px] font-mono text-[9.5px] font-medium text-text-muted",
		TITLE: "font-serif text-[17px] font-normal text-text",
	},
	LAYER: "col-start-1 row-start-1",
	LAYER_INACTIVE: "invisible",
	ROOT: "flex w-full min-w-0 flex-1 items-center justify-center border-t border-border bg-bg p-10 tablet:flex-[1.3] tablet:border-l tablet:border-t-0",
	SEARCH: {
		BAR: "mb-4 flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-4 py-3.5 text-accent",
		QUERY: "text-[13.5px] text-text",
		RESULT_ACTIVE: "rounded-md border border-border bg-surface px-3 py-2.5",
		RESULT_DIMMED:
			"rounded-md border border-border bg-surface px-3 py-2.5 opacity-60",
		RESULT_SUBTITLE: "mt-0.5 text-[11.5px] text-text-faint",
		RESULT_TITLE: "text-[12.5px] font-medium text-text",
		RESULTS: "flex flex-col gap-2",
		ROOT: "w-full max-w-[340px]",
	},
	SECURITY: {
		AUDIT:
			"flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-[12px] text-text-muted",
		AUDIT_TIME: "font-mono text-[11px]",
		BADGE:
			"rounded-[5px] border border-border bg-surface px-2.5 py-[5px] font-mono text-[10.5px] font-medium text-text-muted",
		BADGES: "mb-3.5 flex gap-2",
		ROOT: "w-full max-w-[340px]",
	},
	STACK: "grid w-full justify-items-center",
} as const;

type Properties = {
	activeFeature: ValueOf<typeof FeatureId>;
};

const SearchPreview: React.FC = () => (
	<div className={FEATURE_PREVIEW_CLASS.SEARCH.ROOT}>
		<div className={FEATURE_PREVIEW_CLASS.SEARCH.BAR}>
			<Icon name="search" size={FEATURE_SEARCH_BAR_ICON_SIZE} />
			<span className={FEATURE_PREVIEW_CLASS.SEARCH.QUERY}>
				{FEATURE_PREVIEW_CONTENT.SEARCH.QUERY}
			</span>
		</div>
		<div className={FEATURE_PREVIEW_CLASS.SEARCH.RESULTS}>
			{FEATURE_PREVIEW_CONTENT.SEARCH.RESULTS.map((result) => (
				<div
					className={
						result.isDimmed
							? FEATURE_PREVIEW_CLASS.SEARCH.RESULT_DIMMED
							: FEATURE_PREVIEW_CLASS.SEARCH.RESULT_ACTIVE
					}
					key={result.title}
				>
					<div className={FEATURE_PREVIEW_CLASS.SEARCH.RESULT_TITLE}>
						{result.title}
					</div>
					<div className={FEATURE_PREVIEW_CLASS.SEARCH.RESULT_SUBTITLE}>
						{result.subtitle}
					</div>
				</div>
			))}
		</div>
	</div>
);

const ExtractPreview: React.FC = () => (
	<div className={FEATURE_PREVIEW_CLASS.EXTRACT.ROOT}>
		<div className={FEATURE_PREVIEW_CLASS.EXTRACT.RAW}>
			{FEATURE_PREVIEW_CONTENT.EXTRACT.RAW}
		</div>
		<span className={FEATURE_PREVIEW_CLASS.EXTRACT.ARROW}>
			<Icon name="arrow-right-long" size={FEATURE_EXTRACT_ARROW_ICON_SIZE} />
		</span>
		<div className={FEATURE_PREVIEW_CLASS.EXTRACT.RESULT}>
			<div className={FEATURE_PREVIEW_CLASS.EXTRACT.LABEL}>
				{FEATURE_PREVIEW_CONTENT.EXTRACT.LABEL}
			</div>
			<div className={FEATURE_PREVIEW_CLASS.EXTRACT.VALUE}>
				{FEATURE_PREVIEW_CONTENT.EXTRACT.VALUE}
			</div>
		</div>
	</div>
);

const GlossaryPreview: React.FC = () => (
	<div className={FEATURE_PREVIEW_CLASS.GLOSSARY.ROOT}>
		<div className={FEATURE_PREVIEW_CLASS.GLOSSARY.HEADER}>
			<h4 className={FEATURE_PREVIEW_CLASS.GLOSSARY.TITLE}>
				{FEATURE_PREVIEW_CONTENT.GLOSSARY.TITLE}
			</h4>
			<span className={FEATURE_PREVIEW_CLASS.GLOSSARY.TAG}>
				{FEATURE_PREVIEW_CONTENT.GLOSSARY.TAG}
			</span>
		</div>
		<p className={FEATURE_PREVIEW_CLASS.GLOSSARY.BODY}>
			{FEATURE_PREVIEW_CONTENT.GLOSSARY.BODY}
		</p>
	</div>
);

const SecurityPreview: React.FC = () => (
	<div className={FEATURE_PREVIEW_CLASS.SECURITY.ROOT}>
		<div className={FEATURE_PREVIEW_CLASS.SECURITY.BADGES}>
			{FEATURE_PREVIEW_CONTENT.SECURITY.BADGES.map((badge) => (
				<span className={FEATURE_PREVIEW_CLASS.SECURITY.BADGE} key={badge}>
					{badge}
				</span>
			))}
		</div>
		<div className={FEATURE_PREVIEW_CLASS.SECURITY.AUDIT}>
			<span>{FEATURE_PREVIEW_CONTENT.SECURITY.AUDIT_ACTOR}</span>
			<span className={FEATURE_PREVIEW_CLASS.SECURITY.AUDIT_TIME}>
				{FEATURE_PREVIEW_CONTENT.SECURITY.AUDIT_TIME}
			</span>
		</div>
	</div>
);

const previewByFeatureId = {
	[FeatureId.EXTRACT]: ExtractPreview,
	[FeatureId.GLOSSARY]: GlossaryPreview,
	[FeatureId.SEARCH]: SearchPreview,
	[FeatureId.SECURITY]: SecurityPreview,
} as const satisfies Record<ValueOf<typeof FeatureId>, React.FC>;

const FeaturePreview: React.FC<Properties> = ({
	activeFeature,
}: Properties) => (
	<div className={FEATURE_PREVIEW_CLASS.ROOT}>
		<div className={FEATURE_PREVIEW_CLASS.STACK}>
			{FEATURES_LIST.map((feature) => {
				const Preview = previewByFeatureId[feature.id];
				const isActive = feature.id === activeFeature;

				return (
					<div
						aria-hidden={!isActive}
						className={getValidClassNames(
							FEATURE_PREVIEW_CLASS.LAYER,
							!isActive && FEATURE_PREVIEW_CLASS.LAYER_INACTIVE,
						)}
						key={feature.id}
					>
						<Preview></Preview>
					</div>
				);
			})}
		</div>
	</div>
);

export { FeaturePreview };
