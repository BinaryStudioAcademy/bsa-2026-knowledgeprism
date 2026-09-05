import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3PresignedUrlRule } from "@knowledgeprism/constants";

const PRESIGNED_URL_EXPIRY_SECONDS = S3PresignedUrlRule.UPLOAD_EXPIRY_SECONDS;

type Parameters = {
	bucketName: string;
	contentType: string;
	key: string;
	s3Client: S3Client;
};

const createPresignedUploadUrl = ({
	bucketName,
	contentType,
	key,
	s3Client,
}: Parameters): Promise<string> => {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		ContentType: contentType,
		Key: key,
	});

	return getSignedUrl(s3Client, command, {
		expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
	});
};

export { createPresignedUploadUrl, PRESIGNED_URL_EXPIRY_SECONDS };
