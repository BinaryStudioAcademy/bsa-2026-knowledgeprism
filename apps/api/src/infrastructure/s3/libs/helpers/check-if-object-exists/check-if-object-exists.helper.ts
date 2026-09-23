import { HeadObjectCommand, type S3Client } from "@aws-sdk/client-s3";

const NOT_FOUND_ERROR_NAME = "NotFound";

type Parameters = {
	bucketName: string;
	key: string;
	s3Client: S3Client;
};

const checkIfObjectExists = async ({
	bucketName,
	key,
	s3Client,
}: Parameters): Promise<null | number> => {
	try {
		const response = await s3Client.send(
			new HeadObjectCommand({ Bucket: bucketName, Key: key }),
		);

		return response.ContentLength ?? null;
	} catch (error) {
		if (error instanceof Error && error.name === NOT_FOUND_ERROR_NAME) {
			return null;
		}

		throw error;
	}
};

export { checkIfObjectExists };
