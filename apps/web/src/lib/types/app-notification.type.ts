import { type ValueOf } from "~/lib/types/types.js";

import { NotificationVariant } from "../enums/enums.js";

type AppNotification = {
	message: string;
	variant: ValueOf<typeof NotificationVariant>;
};

export { type AppNotification };
