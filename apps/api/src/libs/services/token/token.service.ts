import crypto from "node:crypto";

const DEFAULT_BYTES_LENGTH = 32;
class TokenService {
	public createToken(): Promise<string> {
		const token = crypto.randomBytes(DEFAULT_BYTES_LENGTH).toString("hex");

		return Promise.resolve(token);
	}
}

export { TokenService };
