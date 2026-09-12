import { HeadObjectCommand, type S3Client } from "@aws-sdk/client-s3";

const NOT_FOUND_ERROR_NAME = "NotFound";

type Parameters = {
	bucketName: string;
	key: string;
	s3Client: S3Client;
};

const checkObjectExists = async ({
	bucketName,
	key,
	s3Client,
}: Parameters): Promise<boolean> => {
	try {
		await s3Client.send(
			new HeadObjectCommand({ Bucket: bucketName, Key: key }),
		);

		return true;
	} catch (error) {
		if (error instanceof Error && error.name === NOT_FOUND_ERROR_NAME) {
			return false;
		}

		throw error;
	}
};

export { checkObjectExists };
