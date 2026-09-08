import { type SerializedError } from "@reduxjs/toolkit";

import { type AppError } from "./app-error.type.js";

type SerializedAppError = Partial<
	Pick<AppError, "details" | "errorType" | "status">
> &
	SerializedError;

export { type SerializedAppError };
