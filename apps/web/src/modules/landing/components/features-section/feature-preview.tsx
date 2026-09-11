import { Heading } from "~/components/heading/heading.js";
import { Icon } from "~/components/icon/icon.js";
import { Paragraph, ParagraphSize } from "~/components/paragraph/paragraph.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	FEATURE_EXTRACT_ARROW_ICON_SIZE,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_SEARCH_BAR_ICON_SIZE,
	FEATURES_LIST,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

type Properties = {
	activeFeature: ValueOf<typeof FeatureId>;
};

const SearchPreview: React.FC = () => (
	<div className="w-full max-w-[340px]">
		<div className="mb-4 flex items-center gap-2.5 rounded-[10px] border border-border bg-surface px-4 py-3.5 text-accent">
			<Icon name="search" size={FEATURE_SEARCH_BAR_ICON_SIZE} />
			<span className="text-[13.5px] text-text">
				{FEATURE_PREVIEW_CONTENT.SEARCH.QUERY}
			</span>
		</div>
		<div className="flex flex-col gap-2">
			{FEATURE_PREVIEW_CONTENT.SEARCH.RESULTS.map((result) => (
				<div
					className={getValidClassNames(
						"rounded-md border border-border bg-surface px-3 py-2.5",
						result.isDimmed && "opacity-60",
					)}
					key={result.title}
				>
					<div className="text-[12.5px] font-medium text-text">
						{result.title}
					</div>
					<div className="mt-0.5 text-[11.5px] text-text-faint">
						{result.subtitle}
					</div>
				</div>
			))}
		</div>
	</div>
);

const ExtractPreview: React.FC = () => (
	<div className="flex w-full max-w-[340px] items-center gap-3.5">
		<div className="w-[90px] rounded-md border border-border bg-surface p-3 text-center text-[11px] text-text-faint">
			{FEATURE_PREVIEW_CONTENT.EXTRACT.RAW}
		</div>
		<span className="shrink-0 text-accent">
			<Icon name="arrow-right-long" size={FEATURE_EXTRACT_ARROW_ICON_SIZE} />
		</span>
		<div className="flex-1 rounded-md border border-accent bg-success-bg p-3">
			<div className="font-medium text-[9.5px] uppercase text-accent">
				{FEATURE_PREVIEW_CONTENT.EXTRACT.LABEL}
			</div>
			<div className="mt-0.5 text-[13px] font-medium text-text">
				{FEATURE_PREVIEW_CONTENT.EXTRACT.VALUE}
			</div>
		</div>
	</div>
);

const GlossaryPreview: React.FC = () => (
	<div className="w-full max-w-[340px] rounded-[10px] border border-border bg-surface p-[18px]">
		<div className="mb-2 flex justify-between">
			<Heading level="4">{FEATURE_PREVIEW_CONTENT.GLOSSARY.TITLE}</Heading>
			<span className="rounded-[5px] bg-border-subtle px-2 py-[3px] font-mono text-[9.5px] font-medium text-text-muted">
				{FEATURE_PREVIEW_CONTENT.GLOSSARY.TAG}
			</span>
		</div>
		<Paragraph size={ParagraphSize.BODY_SMALL}>
			{FEATURE_PREVIEW_CONTENT.GLOSSARY.BODY}
		</Paragraph>
	</div>
);

const SecurityPreview: React.FC = () => (
	<div className="w-full max-w-[340px]">
		<div className="mb-3.5 flex gap-2">
			{FEATURE_PREVIEW_CONTENT.SECURITY.BADGES.map((badge) => (
				<span
					className="rounded-[5px] border border-border bg-surface px-2.5 py-[5px] font-mono text-[10.5px] font-medium text-text-muted"
					key={badge}
				>
					{badge}
				</span>
			))}
		</div>
		<div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5 text-[12px] text-text-muted">
			<span>{FEATURE_PREVIEW_CONTENT.SECURITY.AUDIT_ACTOR}</span>
			<span className="font-mono text-[11px]">
				{FEATURE_PREVIEW_CONTENT.SECURITY.AUDIT_TIME}
			</span>
		</div>
	</div>
);

const featureIdToPreview = {
	[FeatureId.EXTRACT]: ExtractPreview,
	[FeatureId.GLOSSARY]: GlossaryPreview,
	[FeatureId.SEARCH]: SearchPreview,
	[FeatureId.SECURITY]: SecurityPreview,
} as const satisfies Record<ValueOf<typeof FeatureId>, React.FC>;

const FeaturePreview: React.FC<Properties> = ({
	activeFeature,
}: Properties) => (
	<div className="flex w-full min-w-0 flex-1 items-center justify-center border-t border-border bg-bg p-10 tablet:flex-[1.3] tablet:border-l tablet:border-t-0">
		<div className="grid w-full justify-items-center">
			{FEATURES_LIST.map((feature) => {
				const Preview = featureIdToPreview[feature.id];
				const isActive = feature.id === activeFeature;

				return (
					<div
						aria-hidden={!isActive}
						className={getValidClassNames(
							"col-start-1 row-start-1",
							!isActive && "invisible",
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
