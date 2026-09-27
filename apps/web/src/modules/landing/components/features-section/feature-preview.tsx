import { Heading } from "~/components/heading/heading.js";
import { Icon } from "~/components/icon/icon.js";
import { Paragraph, ParagraphSize } from "~/components/paragraph/paragraph.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	FEATURE_AVATAR_ICON_SIZE,
	FEATURE_LINK_ICON_SIZE,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_PREVIEW_FRAME_CLASS,
	FEATURE_PREVIEW_ICON_SIZE,
	FEATURE_SOURCE_ICON_SIZE,
	FEATURES_LIST,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

type Properties = {
	activeFeature: ValueOf<typeof FeatureId>;
};

const KnowledgeBasePreview: React.FC = () => (
	<div
		className={getValidClassNames(
			FEATURE_PREVIEW_FRAME_CLASS,
			"overflow-hidden rounded-[10px] border border-border bg-surface",
		)}
	>
		<div className="border-b border-border-subtle px-4 py-3 text-[12.5px] font-medium text-text">
			{FEATURE_PREVIEW_CONTENT.KNOWLEDGE_BASE.TITLE}
		</div>
		<div className="flex flex-col gap-0.5 px-3 py-3">
			{FEATURE_PREVIEW_CONTENT.KNOWLEDGE_BASE.SECTIONS.map((section) => (
				<div key={section.title}>
					<div className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-text-muted">
						<Icon name="folder" size={FEATURE_PREVIEW_ICON_SIZE} />
						{section.title}
					</div>
					{section.pages.map((page) => (
						<div
							className={getValidClassNames(
								"ml-4 flex items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[13px]",
								section.selectedPage === page
									? "bg-secondary font-medium text-text"
									: "text-text-muted",
							)}
							key={`${section.title}-${page}`}
						>
							<Icon name="file-rounded" size={FEATURE_PREVIEW_ICON_SIZE} />
							{page}
						</div>
					))}
				</div>
			))}
		</div>
	</div>
);

const IntegrationPreview: React.FC = () => (
	<div
		className={getValidClassNames(
			FEATURE_PREVIEW_FRAME_CLASS,
			"rounded-[10px] border border-border bg-surface p-[18px]",
		)}
	>
		<p className="mb-3 font-mono text-[10px] uppercase tracking-[0.08em] text-text-faint">
			Proposed structure
		</p>
		<p className="mb-2 flex items-center gap-2 text-[12.5px] text-text-muted">
			<Icon name="folder" size={FEATURE_PREVIEW_ICON_SIZE} />
			{FEATURE_PREVIEW_CONTENT.INTEGRATION.PARENT}
		</p>
		<div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-accent bg-success-bg px-3 py-2.5">
			<span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-text">
				<Icon name="file-rounded" size={FEATURE_PREVIEW_ICON_SIZE} />
				{FEATURE_PREVIEW_CONTENT.INTEGRATION.TITLE}
			</span>
			<span className="inline-flex shrink-0 items-center justify-center rounded-full border border-accent/25 bg-success-bg px-2 py-0.5 font-sans text-[10px] font-medium lowercase tracking-wide text-accent">
				{FEATURE_PREVIEW_CONTENT.INTEGRATION.STATUS}
			</span>
		</div>
		<span className="inline-flex rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-fg">
			{FEATURE_PREVIEW_CONTENT.INTEGRATION.ACTION}
		</span>
	</div>
);

const AskPrismPreview: React.FC = () => (
	<div className={FEATURE_PREVIEW_FRAME_CLASS}>
		<div className="mb-2.5 flex justify-end">
			<span className="max-w-[88%] rounded-[14px_14px_4px_14px] bg-primary px-3 py-2 text-[12.5px] leading-[1.45] text-primary-fg">
				{FEATURE_PREVIEW_CONTENT.ASK_PRISM.QUESTION}
			</span>
		</div>
		<div className="flex gap-2">
			<span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-white">
				<Icon name="prism" size={FEATURE_AVATAR_ICON_SIZE} />
			</span>
			<div className="min-w-0">
				<p className="text-[13px] leading-[1.5] text-text">
					{FEATURE_PREVIEW_CONTENT.ASK_PRISM.ANSWER}
				</p>
				<span className="mt-2 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-accent/20 bg-success-bg px-2.5 py-0.5 text-[11px] font-medium text-accent">
					<Icon name="file" size={FEATURE_SOURCE_ICON_SIZE} />
					<span>{FEATURE_PREVIEW_CONTENT.ASK_PRISM.SOURCE_TITLE}</span>
					<span className="opacity-60">·</span>
					<span className="opacity-85">
						{FEATURE_PREVIEW_CONTENT.ASK_PRISM.SOURCE_SECTION}
					</span>
				</span>
			</div>
		</div>
	</div>
);

const GlossaryPreview: React.FC = () => (
	<div
		className={getValidClassNames(
			FEATURE_PREVIEW_FRAME_CLASS,
			"rounded-[10px] border border-border bg-surface p-[18px]",
		)}
	>
		<div className="mb-2 flex items-start justify-between gap-2">
			<Heading level="4">{FEATURE_PREVIEW_CONTENT.GLOSSARY.TITLE}</Heading>
			<span className="rounded-[5px] bg-border-subtle px-2 py-[3px] font-mono text-[9.5px] font-medium text-text-muted">
				{FEATURE_PREVIEW_CONTENT.GLOSSARY.TAG}
			</span>
		</div>
		<Paragraph size={ParagraphSize.BODY_SMALL}>
			{FEATURE_PREVIEW_CONTENT.GLOSSARY.BODY}
		</Paragraph>
		<div className="mt-3 flex items-center gap-1.5 text-[12.5px] font-medium text-accent">
			<Icon name="link" size={FEATURE_LINK_ICON_SIZE} />
			<span>{FEATURE_PREVIEW_CONTENT.GLOSSARY.LINKED_ENTRY}</span>
		</div>
	</div>
);

const featureIdToPreview = {
	[FeatureId.ASK_PRISM]: AskPrismPreview,
	[FeatureId.GLOSSARY]: GlossaryPreview,
	[FeatureId.INTEGRATION]: IntegrationPreview,
	[FeatureId.KNOWLEDGE_BASE]: KnowledgeBasePreview,
} as const satisfies Record<ValueOf<typeof FeatureId>, React.FC>;

const FeaturePreview: React.FC<Properties> = ({
	activeFeature,
}: Properties) => (
	<div className="flex w-full min-w-0 flex-1 items-center justify-center border-t border-border bg-bg p-10 tablet:border-l tablet:border-t-0">
		<div
			className={getValidClassNames(
				FEATURE_PREVIEW_FRAME_CLASS,
				"mx-auto grid items-center",
			)}
		>
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
						<Preview />
					</div>
				);
			})}
		</div>
	</div>
);

export { FeaturePreview };
