import {
	type UserGetAllResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";
import argon2 from "argon2";

import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserRepository } from "~/modules/users/repositories/user.repository.js";
import { type Service } from "~/shared/types/types.js";

class UserService implements Service {
	private userRepository: UserRepository;

	public constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	public async create(
		payload: UserSignUpRequestDto,
	): Promise<UserSignUpResponseDto> {
		const passwordHash = await argon2.hash(payload.password, {
			type: argon2.argon2id,
		});

		const item = await this.userRepository.create(
			UserEntity.initializeNew({
				email: payload.email,
				passwordHash,
			}),
		);

		return item.toObject();
	}

	public delete(): ReturnType<Service["delete"]> {
		return Promise.resolve(true);
	}

	public find(): ReturnType<Service["find"]> {
		return Promise.resolve(null);
	}

	public async findAll(): Promise<UserGetAllResponseDto> {
		const items = await this.userRepository.findAll();

		return {
			items: items.map((item) => item.toObject()),
		};
	}

	public update(): ReturnType<Service["update"]> {
		return Promise.resolve(null);
	}
}

export { UserService };
