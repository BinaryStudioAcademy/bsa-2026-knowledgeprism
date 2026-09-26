import { config } from "~/infrastructure/config/config.js";
import { deleteObjectsByPrefix as deleteObjectsByPrefixHelper } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

type DeleteObjectsByPrefix = (parameters: {
	prefix: string;
}) => Promise<number>;

const deleteObjectsByPrefix: DeleteObjectsByPrefix = ({ prefix }) => {
	return deleteObjectsByPrefixHelper({
		bucketName: config.ENV.AWS.S3_BUCKET_NAME,
		prefix,
		s3Client,
	});
};

export { type DeleteObjectsByPrefix, deleteObjectsByPrefix };
