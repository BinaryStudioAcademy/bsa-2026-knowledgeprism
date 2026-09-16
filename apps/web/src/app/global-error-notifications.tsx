import { type MouseEvent, useCallback, useEffect, useState } from "react";

import { Alert } from "~/components/alert/alert.js";
import { Button } from "~/components/button/button.js";
import { errorService } from "~/lib/errors/error.service.js";
import { type AppError } from "~/lib/types/app-error.type.js";

type ErrorNotification = {
	error: AppError;
	id: string;
};

const GlobalErrorNotifications = (): React.JSX.Element => {
	const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

	useEffect(() => {
		return errorService.subscribe((error) => {
			const notification = {
				error,
				id: crypto.randomUUID(),
			};

			setNotifications((current) => [...current, notification]);
		});
	}, []);

	const handleDismiss = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const notificationId = event.currentTarget.dataset["notificationId"];

			setNotifications((current) =>
				current.filter((notification) => notification.id !== notificationId),
			);
		},
		[],
	);

	return (
		<section
			aria-label="Error notifications"
			className="pointer-events-none fixed inset-x-4 top-4 z-50 flex max-h-[calc(100dvh-2rem)] flex-col gap-3 overflow-y-auto tablet:left-auto tablet:w-96"
		>
			{notifications.map(({ error, id }) => (
				<div
					className="pointer-events-auto rounded-lg border border-border bg-surface p-3 shadow-lg"
					key={id}
				>
					<div role="alert">
						<Alert
							description={error.message}
							title="Something went wrong"
							variant="error"
						/>
					</div>

					<Button
						aria-label={`Dismiss error: ${error.message}`}
						className="mt-2"
						data-notification-id={id}
						onClick={handleDismiss}
						type="button"
						variant="ghost"
					>
						Dismiss
					</Button>
				</div>
			))}
		</section>
	);
};

export { GlobalErrorNotifications };
