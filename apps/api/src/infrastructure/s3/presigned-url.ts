import { config } from "~/infrastructure/config/config.js";
import { createPresignedUploadUrl } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type GeneratePresignedUploadUrl } from "~/infrastructure/s3/libs/types/types.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

const generatePresignedUploadUrl: GeneratePresignedUploadUrl = ({
	contentType,
	key,
}) => {
	return createPresignedUploadUrl({
		bucketName: config.ENV.AWS.S3_BUCKET_NAME,
		contentType,
		key,
		s3Client,
	});
};

export { generatePresignedUploadUrl };
