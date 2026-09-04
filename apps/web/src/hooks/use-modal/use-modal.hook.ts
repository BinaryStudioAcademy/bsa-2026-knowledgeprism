import { useCallback, useState } from "react";

type UseModalResult = {
	hideModal: () => void;
	isOpen: boolean;
	showModal: () => void;
};

const useModal = (isInitiallyOpen = false): UseModalResult => {
	const [isOpen, setIsOpen] = useState(isInitiallyOpen);

	const hideModal = useCallback((): void => {
		setIsOpen(false);
	}, []);

	const showModal = useCallback((): void => {
		setIsOpen(true);
	}, []);

	return {
		hideModal,
		isOpen,
		showModal,
	};
};

export { useModal };
