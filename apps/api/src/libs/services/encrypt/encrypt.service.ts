import argon2 from "argon2";

class EncryptService {
	public async compare({
		data,
		hash,
	}: {
		data: string;
		hash: string;
	}): Promise<boolean> {
		return await argon2.verify(hash, data);
	}
	public async generate(data: string): Promise<string> {
		return await argon2.hash(data);
	}
}

export { EncryptService };
