import { type ValueOf } from "~/lib/types/types.js";

import { type UploadFileStatus } from "./enums.js";

type UploadFile = {
	id: string;
	name: string;
	progress?: number;
	sizeLabel: string;
	status: ValueOf<typeof UploadFileStatus>;
};

export { type UploadFile };
