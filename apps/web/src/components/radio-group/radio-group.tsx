import { Radio } from "~/components/radio/radio.js";
import {
	type Control,
	type FieldPath,
	FieldValues,
	useFormController,
} from "~/hooks/hooks.js";

type Properties<T extends FieldValues = FieldValues> = {
	control: Control<T, null>;
	isDisabled?: boolean;
	name: FieldPath<T>;
	options: RadioOption[];
};

type RadioOption = {
	label: string;
	value: string;
};

const RadioGroup = <T extends FieldValues = FieldValues>({
	control,
	isDisabled = false,
	name,
	options,
}: Properties<T>): React.JSX.Element => {
	const { fieldState } = useFormController({ control, name });
	const errorMessage = fieldState.error?.message;
	const hasError = Boolean(errorMessage);

	return (
		<div className="flex flex-col gap-3">
			{options.map((option) => {
				return (
					<Radio
						control={control}
						isDisabled={isDisabled}
						key={option.value}
						label={option.label}
						name={name}
						value={option.value}
					/>
				);
			})}

			{hasError && <span className="text-xs text-error">{errorMessage}</span>}
		</div>
	);
};

export { RadioGroup };
export { type RadioOption };
