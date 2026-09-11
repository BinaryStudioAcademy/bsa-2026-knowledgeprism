import { type ServerErrorType } from "~/lib/enums/enums.js";
import { type ServerErrorDetail, type ValueOf } from "~/lib/types/types.js";

type AppError = {
	details?: ServerErrorDetail[];
	errorType?: ValueOf<typeof ServerErrorType>;
	message: string;
	status?: number;
};

export { type AppError };
