import { Toggle } from "~/components/components.js";
import { useCallback } from "~/hooks/hooks.js";

import { type AccountPreferences } from "../libs/types.js";

type Properties = {
	description?: string;
	id: keyof AccountPreferences;
	isChecked: boolean;
	label: string;
	onChange: (id: keyof AccountPreferences, isChecked: boolean) => void;
};

const PreferenceRow: React.FC<Properties> = ({
	description,
	id,
	isChecked,
	label,
	onChange,
}: Properties) => {
	const hasDescription = Boolean(description);

	const handleChange = useCallback(
		(isNextChecked: boolean): void => {
			onChange(id, isNextChecked);
		},
		[id, onChange],
	);

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="min-w-0">
				<p className="font-sans text-control text-text">{label}</p>
				{hasDescription && (
					<p className="mt-0.5 font-sans text-sm text-text-muted">
						{description}
					</p>
				)}
			</div>
			<Toggle
				isChecked={isChecked}
				isLabelVisible={false}
				label={label}
				onChange={handleChange}
			/>
		</div>
	);
};

export { PreferenceRow };
