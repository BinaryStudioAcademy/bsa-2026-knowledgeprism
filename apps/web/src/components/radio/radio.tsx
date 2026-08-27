interface RadioProperties {
	label: string;
	name: string;
	value: string;
}

const Radio = ({ label, name, value }: RadioProperties) => {
	return (
		<label className="flex items-center gap-2.5 text-body cursor-pointer">
			<input className="peer sr-only" name={name} type="radio" value={value} />
			<span className="flex size-4.5 shrink-0 items-center justify-center rounded-full border border-border bg-surface after:size-2.25 after:rounded-full after:bg-accent after:opacity-0 peer-checked:after:opacity-100"></span>
			{label}
		</label>
	);
};

export { Radio };
