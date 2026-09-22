import {
	type AnimationEvent,
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
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type AppError } from "~/lib/types/app-error.type.js";

type ErrorNotification = {
	error: AppError;
	id: string;
	isLeaving: boolean;
};

const AUTO_DISMISS_DELAY_MS = 5000;
const CLOSE_ICON_SIZE = 10;
const EXIT_ANIMATION_NAME = "fade-out";

const GlobalErrorNotifications = (): React.JSX.Element => {
	const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

	const dismissTimeoutsReference = useRef<
		Map<string, ReturnType<typeof setTimeout>>
	>(new Map());

	const removeNotification = useCallback((id: string): void => {
		setNotifications((current) =>
			current.filter((notification) => notification.id !== id),
		);
	}, []);

	const startDismiss = useCallback((id: string): void => {
		const timeoutId = dismissTimeoutsReference.current.get(id);

		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
			dismissTimeoutsReference.current.delete(id);
		}

		setNotifications((current) =>
			current.map((notification) =>
				notification.id === id
					? { ...notification, isLeaving: true }
					: notification,
			),
		);
	}, []);

	const scheduleAutoDismiss = useCallback(
		(id: string): void => {
			const timeoutId = setTimeout(() => {
				startDismiss(id);
			}, AUTO_DISMISS_DELAY_MS);

			dismissTimeoutsReference.current.set(id, timeoutId);
		},
		[startDismiss],
	);

	useEffect(() => {
		const unsubscribe = errorService.subscribe((error) => {
			const notification = {
				error,
				id: crypto.randomUUID(),
				isLeaving: false,
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

	const handleAnimationEnd = useCallback(
		(event: AnimationEvent<HTMLDivElement>): void => {
			if (event.target !== event.currentTarget) {
				return;
			}

			if (event.animationName !== EXIT_ANIMATION_NAME) {
				return;
			}

			const notificationId = event.currentTarget.dataset["notificationId"];

			if (notificationId === undefined) {
				return;
			}

			removeNotification(notificationId);
		},
		[removeNotification],
	);

	const handleDismiss = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const notificationId = event.currentTarget.dataset["notificationId"];

			if (notificationId === undefined) {
				return;
			}

			startDismiss(notificationId);
		},
		[startDismiss],
	);

	return (
		<section
			aria-label="Error notifications"
			className="pointer-events-none fixed inset-x-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto tablet:left-auto tablet:w-96"
		>
			{notifications.map(({ error, id, isLeaving }) => (
				<div
					className={getValidClassNames(
						"grid transition-[grid-template-rows] duration-[250ms] ease-in-out",
						isLeaving ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
					)}
					key={id}
				>
					<div className="overflow-hidden">
						<div
							className={getValidClassNames(
								"pointer-events-auto relative",
								isLeaving ? "animate-fade-out" : "animate-fade-in",
							)}
							data-notification-id={id}
							onAnimationEnd={handleAnimationEnd}
						>
							<div className="pt-2 pb-3" role="alert">
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
					</div>
				</div>
			))}
		</section>
	);
};

export { GlobalErrorNotifications };
