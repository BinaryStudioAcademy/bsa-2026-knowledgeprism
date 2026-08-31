import {
	type Control,
	type FieldPath,
	type FieldValues,
	useCallback,
	useFormController,
} from "~/hooks/hooks.js";

type Properties<T extends FieldValues = FieldValues> = {
	control: Control<T, null>;
	isDisabled?: boolean;
	label: string;
	name: FieldPath<T>;
	value: string;
};

const Radio = <T extends FieldValues = FieldValues>({
	control,
	isDisabled = false,
	label,
	name,
	value,
}: Properties<T>): React.JSX.Element => {
	const { field, fieldState } = useFormController({ control, name });

	const isChecked = field.value === value;
	const error = fieldState.error;
	const errorMessage = error?.message;
	const hasError = Boolean(errorMessage);

	const handleChange = useCallback((): void => {
		field.onChange(value);
	}, [field, value]);

	return (
		<div className="flex flex-col">
			<label className="flex items-center gap-2.5 text-control cursor-pointer select-none has-disabled:cursor-not-allowed has-disabled:opacity-50">
				<input
					{...field}
					checked={isChecked}
					className="peer sr-only"
					disabled={isDisabled}
					onChange={handleChange}
					type="radio"
					value={value}
				/>
				<span className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-control-inactive bg-surface after:size-2.25 after:rounded-full after:bg-accent after:opacity-0 peer-checked:after:opacity-100 peer-focus-visible:ring-3 peer-focus-visible:ring-accent/35"></span>
				{label}
			</label>

			{hasError && <span className="form-error-message">{errorMessage}</span>}
		</div>
	);
};

export { Radio };
