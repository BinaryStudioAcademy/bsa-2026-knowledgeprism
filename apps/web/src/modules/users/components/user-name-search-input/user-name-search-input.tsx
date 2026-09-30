import { useCallback, useRef } from "react";

import { Icon } from "~/components/icon/icon.js";
import {
	USERNAME_SEARCH_MAXIMUM_LENGTH,
	UsernameSearchCopy,
} from "~/modules/users/libs/constants/user-name-search.constant.js";

const SEARCH_ICON_SIZE = 14;

type Properties = {
	onChange: (value: string) => void;
	value: string;
};

const UsernameSearchInput: React.FC<Properties> = ({
	onChange,
	value,
}: Properties) => {
	const inputReference = useRef<HTMLInputElement>(null);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			onChange(event.target.value);
		},
		[onChange],
	);

	const handleClear = useCallback((): void => {
		onChange("");
		inputReference.current?.focus();
	}, [onChange]);

	return (
		<div className="relative w-full desktop:max-w-90">
			<input
				aria-label={UsernameSearchCopy.LABEL}
				className="block h-9 w-full appearance-none rounded-md border border-border bg-surface pl-8 pr-8 text-sm text-text outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15"
				maxLength={USERNAME_SEARCH_MAXIMUM_LENGTH}
				onChange={handleChange}
				placeholder={UsernameSearchCopy.PLACEHOLDER}
				ref={inputReference}
				type="text"
				value={value}
			/>
			<div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
				<Icon name="search" size={SEARCH_ICON_SIZE} />
			</div>
			{value && (
				<button
					aria-label={UsernameSearchCopy.CLEAR_LABEL}
					className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35"
					onClick={handleClear}
					type="button"
				>
					<Icon name="close" size={SEARCH_ICON_SIZE} />
				</button>
			)}
		</div>
	);
};

export { UsernameSearchInput };
