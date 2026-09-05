import { Icon } from "~/components/icon/icon.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	FEATURE_EXTRACT_ARROW_ICON_SIZE,
	FEATURE_PREVIEW_CLASS,
	FEATURE_PREVIEW_CONTENT,
	FEATURE_SEARCH_BAR_ICON_SIZE,
	FEATURES_LIST,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

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
