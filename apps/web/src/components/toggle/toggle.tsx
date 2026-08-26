import { useCallback } from "~/hooks/hooks.js";

type Properties = {
	isChecked: boolean;
	isDisabled?: boolean;
	isLabelVisible?: boolean;
	label: string;
	name?: string;
	onChange: (isChecked: boolean) => void;
};

const Toggle: React.FC<Properties> = ({
	isChecked,
	isDisabled = false,
	isLabelVisible = true,
	label,
	name,
	onChange,
}: Properties) => {
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			onChange(event.target.checked);
		},
		[onChange],
	);

	const className = `inline-flex items-center gap-2.5 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`;

	return (
		<label className={className}>
			<input
				aria-label={label}
				checked={isChecked}
				className="peer sr-only"
				disabled={isDisabled}
				name={name}
				onChange={handleChange}
				role="switch"
				type="checkbox"
			/>

			<span
				aria-hidden="true"
				className="relative inline-block h-5 w-9 shrink-0 rounded-full bg-control-inactive transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-control after:transition-transform after:duration-150 after:content-[''] peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:ring-3 peer-focus-visible:ring-accent/35 peer-disabled:opacity-50"
			/>

			{isLabelVisible && (
				<span className="font-sans text-control text-text">{label}</span>
			)}
		</label>
	);
};

export { Toggle };
