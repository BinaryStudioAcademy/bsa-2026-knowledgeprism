import { type ContentType } from "~/lib/enums/enums.js";
import { type HTTPOptions } from "~/lib/http/http.js";
import { type ValueOf } from "~/lib/types/types.js";

type HTTPApiOptions = Omit<HTTPOptions, "headers" | "payload"> & {
	contentType: ValueOf<typeof ContentType>;
	hasAuth: boolean;
	payload?: HTTPOptions["payload"];
};

export { type HTTPApiOptions };
