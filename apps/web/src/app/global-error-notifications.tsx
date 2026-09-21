import {
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { Alert } from "~/components/alert/alert.js";
import { Button } from "~/components/button/button.js";
import { Icon } from "~/components/components.js";
import { errorService } from "~/lib/errors/error.service.js";
import { type AppError } from "~/lib/types/app-error.type.js";

type ErrorNotification = {
	error: AppError;
	id: string;
};

const AUTO_DISMISS_DELAY_MS = 5000;
const CLOSE_ICON_SIZE = 10;

const GlobalErrorNotifications = (): React.JSX.Element => {
	const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

	const dismissTimeoutsReference = useRef<
		Map<string, ReturnType<typeof setTimeout>>
	>(new Map());

	const removeNotification = useCallback((id: string): void => {
		setNotifications((current) =>
			current.filter((notification) => notification.id !== id),
		);

		const timeoutId = dismissTimeoutsReference.current.get(id);

		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			dismissTimeoutsReference.current.delete(id);
		}
	}, []);

	const scheduleAutoDismiss = useCallback(
		(id: string): void => {
			const timeoutId = setTimeout(() => {
				removeNotification(id);
			}, AUTO_DISMISS_DELAY_MS);

			dismissTimeoutsReference.current.set(id, timeoutId);
		},
		[removeNotification],
	);

	useEffect(() => {
		const unsubscribe = errorService.subscribe((error) => {
			const notification = {
				error,
				id: crypto.randomUUID(),
			};

			setNotifications((current) => [...current, notification]);
			scheduleAutoDismiss(notification.id);
		});

		const dismissTimeouts = dismissTimeoutsReference.current;

		return () => {
			unsubscribe();

			for (const timeoutId of dismissTimeouts.values()) {
				clearTimeout(timeoutId);
			}

			dismissTimeouts.clear();
		};
	}, [scheduleAutoDismiss]);

	const handleDismiss = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const notificationId = event.currentTarget.dataset["notificationId"];

			if (notificationId === undefined) {
				return;
			}

			removeNotification(notificationId);
		},
		[removeNotification],
	);

	return (
		<section
			aria-label="Error notifications"
			className="pointer-events-none fixed inset-x-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto tablet:left-auto tablet:w-96"
		>
			{notifications.map(({ error, id }) => (
				<div className="pointer-events-auto relative animate-fade-in" key={id}>
					<div className="pt-2" role="alert">
						<Alert
							description={error.message}
							title="Something went wrong"
							variant="error"
						/>
					</div>

					<Button
						aria-label="Close notification"
						className="absolute top-2 right-1 border-0 hover:bg-transparent"
						data-notification-id={id}
						onClick={handleDismiss}
						type="button"
						variant="icon"
					>
						<Icon name="close" size={CLOSE_ICON_SIZE} />
					</Button>
				</div>
			))}
		</section>
	);
};

export { GlobalErrorNotifications };
