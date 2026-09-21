import { config } from "~/infrastructure/config/config.js";
import { checkIfObjectExists } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

type CheckDocumentObjectExists = (parameters: {
	key: string;
}) => Promise<null | number>;

const checkDocumentObjectExists: CheckDocumentObjectExists = ({ key }) => {
	return checkIfObjectExists({
		bucketName: config.ENV.AWS.S3_BUCKET_NAME,
		key,
		s3Client,
	});
};

export { type CheckDocumentObjectExists, checkDocumentObjectExists };
