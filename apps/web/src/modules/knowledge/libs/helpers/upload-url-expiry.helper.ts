const MILLISECONDS_IN_SECOND = 1000;
const UPLOAD_URL_EXPIRY_MARGIN_MS = 30_000;

const getUploadUrlExpiresAt = (expiresInSeconds: number, now: number): number =>
	now + expiresInSeconds * MILLISECONDS_IN_SECOND;

const isUploadUrlUsable = ({
	now,
	uploadUrl,
	uploadUrlExpiresAt,
}: {
	now: number;
	uploadUrl: string | undefined;
	uploadUrlExpiresAt: number | undefined;
}): boolean =>
	Boolean(uploadUrl) &&
	uploadUrlExpiresAt !== undefined &&
	now < uploadUrlExpiresAt - UPLOAD_URL_EXPIRY_MARGIN_MS;

export { getUploadUrlExpiresAt, isUploadUrlUsable };
