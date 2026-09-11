import { type store } from "~/lib/store/store.js";

import { type SerializedAppError } from "./serialized-app-error.type.js";

type AsyncThunkConfig = {
	dispatch: typeof store.instance.dispatch;
	extra: typeof store.extraArguments;
	serializedErrorType: SerializedAppError;
	state: ReturnType<typeof store.instance.getState>;
};

export { type AsyncThunkConfig };
