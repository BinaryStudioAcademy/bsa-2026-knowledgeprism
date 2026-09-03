import crypto from "node:crypto";

const DEFAULT_BYTES_LENGTH = 32;
class TokenService {
	public createToken(): string {
		return crypto.randomBytes(DEFAULT_BYTES_LENGTH).toString("hex");
	}
}

export { TokenService };
