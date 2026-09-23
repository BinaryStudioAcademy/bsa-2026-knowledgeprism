import { useEffect, useState } from "~/hooks/hooks.js";

const useDebouncedValue = <T>(value: T, delayMs: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedValue(value);
		}, delayMs);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [value, delayMs]);

	return debouncedValue;
};

export { useDebouncedValue };
