import { type AppNotification } from "~/lib/types/types.js";

type NotificationListener = (notification: AppNotification) => void;

const EMPTY_LISTENER_COUNT = 0;

class NotificationService {
	private listeners = new Set<NotificationListener>();

	private pendingNotifications: AppNotification[] = [];

	public notify(notification: AppNotification): void {
		if (this.listeners.size === EMPTY_LISTENER_COUNT) {
			this.pendingNotifications.push(notification);

			return;
		}

		for (const listener of this.listeners) {
			listener(notification);
		}
	}

	public subscribe(listener: NotificationListener): () => void {
		this.listeners.add(listener);

		const pendingNotifications = this.pendingNotifications;

		this.pendingNotifications = [];

		for (const notification of pendingNotifications) {
			listener(notification);
		}

		return (): void => {
			this.listeners.delete(listener);
		};
	}
}

const notificationService = new NotificationService();

export { notificationService };
