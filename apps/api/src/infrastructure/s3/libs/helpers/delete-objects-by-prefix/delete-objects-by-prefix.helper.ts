import {
	DeleteObjectsCommand,
	ListObjectsV2Command,
	type ObjectIdentifier,
	type S3Client,
} from "@aws-sdk/client-s3";

const FIRST_INDEX = 0;
const NO_OBJECTS = 0;

type Parameters = {
	bucketName: string;
	prefix: string;
	s3Client: S3Client;
};

const deleteObjectsByPrefix = async ({
	bucketName,
	prefix,
	s3Client,
}: Parameters): Promise<number> => {
	let totalDeleted = 0;
	let continuationToken: string | undefined;

	do {
		const listResult = await s3Client.send(
			new ListObjectsV2Command({
				Bucket: bucketName,
				ContinuationToken: continuationToken,
				Prefix: prefix,
			}),
		);

		const objects = listResult.Contents;

		if (objects && objects.length > NO_OBJECTS) {
			const keysToDelete: ObjectIdentifier[] = objects.flatMap((object) => {
				return object.Key ? [{ Key: object.Key }] : [];
			});

			if (keysToDelete.length > NO_OBJECTS) {
				const deletionResult = await s3Client.send(
					new DeleteObjectsCommand({
						Bucket: bucketName,
						Delete: {
							Objects: keysToDelete,
							Quiet: true,
						},
					}),
				);

				if (
					deletionResult.Errors &&
					deletionResult.Errors.length > NO_OBJECTS
				) {
					const firstError = deletionResult.Errors[FIRST_INDEX];
					throw new Error(
						`Failed to delete S3 objects: ${firstError?.Message ?? "Unknown error"}`,
					);
				}

				totalDeleted += keysToDelete.length;
			}
		}

		continuationToken = listResult.NextContinuationToken;
	} while (continuationToken);

	return totalDeleted;
};

export { deleteObjectsByPrefix };
