import { S3Client } from "@aws-sdk/client-s3";

import { config } from "~/config/config.js";

const s3Client = new S3Client({
	region: config.ENV.AWS.REGION,
});

export { s3Client };
