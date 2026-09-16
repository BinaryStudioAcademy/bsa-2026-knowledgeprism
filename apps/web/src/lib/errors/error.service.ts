import { normalizeError } from "~/lib/helpers/normalize-error.helper.js";
import { type AppError } from "~/lib/types/app-error.type.js";

type ErrorListener = (error: AppError) => void;

const EMPTY_LISTENER_COUNT = 0;

class ErrorService {
	private listeners = new Set<ErrorListener>();

	private pendingErrors: AppError[] = [];

	public notify(error: unknown): void {
		const normalizedError = normalizeError(error);

		if (this.listeners.size === EMPTY_LISTENER_COUNT) {
			this.pendingErrors.push(normalizedError);

			return;
		}

		for (const listener of this.listeners) {
			listener(normalizedError);
		}
	}

	public subscribe(listener: ErrorListener): () => void {
		this.listeners.add(listener);

		const pendingErrors = this.pendingErrors;

		this.pendingErrors = [];

		for (const error of pendingErrors) {
			listener(error);
		}

		return (): void => {
			this.listeners.delete(listener);
		};
	}
}

const errorService = new ErrorService();

export { errorService };
