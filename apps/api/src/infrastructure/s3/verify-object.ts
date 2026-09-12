import { config } from "~/infrastructure/config/config.js";
import { checkObjectExists } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type CheckDocumentObjectExists } from "~/infrastructure/s3/libs/types/types.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

const checkDocumentObjectExists: CheckDocumentObjectExists = ({ key }) => {
	return checkObjectExists({
		bucketName: config.ENV.AWS.S3_BUCKET_NAME,
		key,
		s3Client,
	});
};

export { checkDocumentObjectExists };
