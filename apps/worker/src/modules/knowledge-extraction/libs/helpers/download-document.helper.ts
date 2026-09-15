import { GetObjectCommand } from "@aws-sdk/client-s3";

import { config } from "~/config/config.js";
import { s3Client } from "~/s3/s3.js";

const downloadDocument = async (s3Key: string): Promise<Uint8Array> => {
	const response = await s3Client.send(
		new GetObjectCommand({
			Bucket: config.ENV.AWS.S3_BUCKET_NAME,
			Key: s3Key,
		}),
	);

	if (!response.Body) {
		throw new Error(`Document not found in S3: ${s3Key}`);
	}

	return await response.Body.transformToByteArray();
};

export { downloadDocument };
