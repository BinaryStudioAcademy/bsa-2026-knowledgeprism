import { Toggle } from "~/components/components.js";

type Properties = {
	description?: string;
	isChecked: boolean;
	label: string;
	onChange: (isChecked: boolean) => void;
};

const PreferenceRow: React.FC<Properties> = ({
	description,
	isChecked,
	label,
	onChange,
}: Properties) => {
	const hasDescription = Boolean(description);

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
				onChange={onChange}
			/>
		</div>
	);
};

export { PreferenceRow };
