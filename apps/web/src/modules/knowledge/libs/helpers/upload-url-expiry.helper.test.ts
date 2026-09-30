import { describe, expect, it } from "vitest";

import {
	getUploadUrlExpiresAt,
	isUploadUrlUsable,
} from "./upload-url-expiry.helper.js";

const NOW = 1_000_000;
const EXPIRES_IN_SECONDS = 900;
const EXPIRES_AT = getUploadUrlExpiresAt(EXPIRES_IN_SECONDS, NOW);
const UPLOAD_URL = "https://bucket.s3.amazonaws.com/key?signature";
const ONE_MINUTE_MS = 60_000;
const TEN_SECONDS_MS = 10_000;

describe("isUploadUrlUsable", () => {
	it("reuses a URL that is still well within its expiry", () => {
		expect(
			isUploadUrlUsable({
				now: NOW + ONE_MINUTE_MS,
				uploadUrl: UPLOAD_URL,
				uploadUrlExpiresAt: EXPIRES_AT,
			}),
		).toBe(true);
	});

	it("rejects a URL that has expired", () => {
		expect(
			isUploadUrlUsable({
				now: EXPIRES_AT + ONE_MINUTE_MS,
				uploadUrl: UPLOAD_URL,
				uploadUrlExpiresAt: EXPIRES_AT,
			}),
		).toBe(false);
	});

	it("rejects a URL that is about to expire", () => {
		expect(
			isUploadUrlUsable({
				now: EXPIRES_AT - TEN_SECONDS_MS,
				uploadUrl: UPLOAD_URL,
				uploadUrlExpiresAt: EXPIRES_AT,
			}),
		).toBe(false);
	});

	it("rejects a URL with no known expiry", () => {
		expect(
			isUploadUrlUsable({
				now: NOW,
				uploadUrl: UPLOAD_URL,
				uploadUrlExpiresAt: undefined,
			}),
		).toBe(false);
	});
});
