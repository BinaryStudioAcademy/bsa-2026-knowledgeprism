interface RadioProperties {
	isDisabled?: boolean;
	label: string;
	name: string;
	value: string;
}

const Radio = ({ isDisabled = false, label, name, value }: RadioProperties) => {
	return (
		<label className="flex items-center gap-2.5 text-body cursor-pointer select-none has-disabled:cursor-not-allowed has-disabled:opacity-50">
			<input
				className="peer sr-only"
				disabled={isDisabled}
				name={name}
				type="radio"
				value={value}
			/>
			<span className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border bg-surface after:size-2.25 after:rounded-full after:bg-accent after:opacity-0 peer-checked:after:opacity-100 peer-focus-visible:ring-3 peer-focus-visible:ring-accent/35"></span>
			{label}
		</label>
	);
};

export { Radio };
