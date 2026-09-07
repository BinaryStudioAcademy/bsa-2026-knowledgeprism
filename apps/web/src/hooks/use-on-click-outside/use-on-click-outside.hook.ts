import { type RefObject, useEffect } from "react";

const useOnClickOutside = <T extends HTMLElement>(
	elementReference: RefObject<null | T>,
	onClickOutside: () => void,
	isEnabled: boolean,
): void => {
	useEffect(() => {
		if (!isEnabled) {
			return;
		}

		const handleClickOutside = (event: Event): void => {
			const { target } = event;

			if (
				elementReference.current &&
				target instanceof Node &&
				!elementReference.current.contains(target)
			) {
				onClickOutside();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("touchstart", handleClickOutside);

		return (): void => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("touchstart", handleClickOutside);
		};
	}, [elementReference, isEnabled, onClickOutside]);
};

export { useOnClickOutside };
