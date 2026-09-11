import { config } from "~/infrastructure/config/config.js";
import { getObjectBytes } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type FetchDocumentObjectBytes } from "~/infrastructure/s3/libs/types/types.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

const fetchDocumentObjectBytes: FetchDocumentObjectBytes = ({ key }) => {
	return getObjectBytes({
		bucketName: config.ENV.AWS.S3_BUCKET_NAME,
		key,
		s3Client,
	});
};

export { fetchDocumentObjectBytes };
