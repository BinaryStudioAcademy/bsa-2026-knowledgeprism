import { Button, Modal } from "~/components/components.js";
import { useCallback, useState } from "~/hooks/hooks.js";

type Properties = {
	name: string;
	onCancel: () => void;
	onConfirm: () => Promise<void>;
};

const DeleteTermModal: React.FC<Properties> = ({
	name,
	onCancel,
	onConfirm,
}: Properties) => {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = useCallback((): void => {
		setIsDeleting(true);
		void onConfirm().finally(() => {
			setIsDeleting(false);
		});
	}, [onConfirm]);

	return (
		<Modal isOpen onClose={onCancel} title="Delete term?">
			<p className="break-words text-sm leading-[1.6] text-text">
				“{name}” will be removed from the glossary, along with its links to
				other terms.
			</p>
			<div className="mt-6 flex justify-end gap-3">
				<Button disabled={isDeleting} onClick={onCancel} variant="secondary">
					Cancel
				</Button>
				<Button
					isLoading={isDeleting}
					onClick={handleConfirm}
					variant="destructive"
				>
					Delete
				</Button>
			</div>
		</Modal>
	);
};

export { DeleteTermModal };
