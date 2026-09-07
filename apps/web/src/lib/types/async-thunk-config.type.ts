import { type store } from "~/lib/store/store.js";

import { type AppError } from "./app-error.type.js";

type AsyncThunkConfig = {
	dispatch: typeof store.instance.dispatch;
	extra: typeof store.extraArguments;
	serializedErrorType: AppError;
	state: ReturnType<typeof store.instance.getState>;
};

export { type AsyncThunkConfig };
