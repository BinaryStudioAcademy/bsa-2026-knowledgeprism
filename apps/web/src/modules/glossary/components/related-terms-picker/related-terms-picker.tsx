import { GlossaryValidationRule } from "@knowledgeprism/constants";
import {
	type GlossaryTermItemDto,
	type GlossaryTermRequestDto,
} from "@knowledgeprism/types";

import { type Control, useCallback, useFormController } from "~/hooks/hooks.js";

import { RelatedTermOption } from "./related-term-option.js";

const EMPTY_LENGTH = 0;

type Properties = {
	control: Control<GlossaryTermRequestDto, null>;
	disabled: boolean;
	options: GlossaryTermItemDto[];
};

const RelatedTermsPicker: React.FC<Properties> = ({
	control,
	disabled,
	options,
}: Properties) => {
	const { field, fieldState } = useFormController({
		control,
		name: "relatedTermIds",
	});
	const selectedIds = field.value;
	const { onChange } = field;
	const isLimitReached =
		selectedIds.length >= GlossaryValidationRule.RELATED_TERMS_MAXIMUM_COUNT;

	const handleToggle = useCallback(
		(id: number): void => {
			onChange(
				selectedIds.includes(id)
					? selectedIds.filter((selectedId) => selectedId !== id)
					: [...selectedIds, id],
			);
		},
		[onChange, selectedIds],
	);

	return (
		<fieldset className="flex flex-col gap-2">
			<legend className="mb-2 font-sans text-sm font-medium text-text">
				Related terms (optional)
			</legend>
			{options.length === EMPTY_LENGTH ? (
				<p className="text-sm text-text-faint">
					No other terms in this glossary yet.
				</p>
			) : (
				<div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
					{options.map((option) => {
						const isSelected = selectedIds.includes(option.id);

						return (
							<RelatedTermOption
								isDisabled={disabled || (!isSelected && isLimitReached)}
								isSelected={isSelected}
								key={option.id}
								onToggle={handleToggle}
								term={option}
							/>
						);
					})}
				</div>
			)}
			{fieldState.error?.message && (
				<span className="text-xs text-error">{fieldState.error.message}</span>
			)}
		</fieldset>
	);
};

export { RelatedTermsPicker };
