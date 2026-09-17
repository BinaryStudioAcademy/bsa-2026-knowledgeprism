import { Icon } from "~/components/icon/icon.js";
import { useCallback } from "~/hooks/hooks.js";

const SEARCH_ICON_SIZE = 14;

type Properties = {
	onChange: (value: string) => void;
	placeholder?: string;
	value: string;
};

const SearchInput: React.FC<Properties> = ({
	onChange,
	placeholder,
	value,
}: Properties) => {
	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			onChange(event.target.value);
		},
		[onChange],
	);

	return (
		<div className="flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-3.5 desktop:max-w-90 desktop:flex-1">
			<span className="text-text-faint">
				<Icon name="search" size={SEARCH_ICON_SIZE} />
			</span>
			<input
				className="w-full border-none bg-transparent font-sans text-[13.5px] text-text outline-none placeholder:text-text-faint"
				onChange={handleChange}
				placeholder={placeholder}
				type="text"
				value={value}
			/>
		</div>
	);
};

export { SearchInput };
