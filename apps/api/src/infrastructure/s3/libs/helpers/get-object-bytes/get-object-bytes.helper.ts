import { GetObjectCommand, type S3Client } from "@aws-sdk/client-s3";

type Parameters = {
	bucketName: string;
	key: string;
	s3Client: S3Client;
};

const getObjectBytes = async ({
	bucketName,
	key,
	s3Client,
}: Parameters): Promise<Uint8Array> => {
	const response = await s3Client.send(
		new GetObjectCommand({ Bucket: bucketName, Key: key }),
	);

	if (!response.Body) {
		throw new Error(`S3 object body is empty for key "${key}".`);
	}

	return await response.Body.transformToByteArray();
};

export { getObjectBytes };
