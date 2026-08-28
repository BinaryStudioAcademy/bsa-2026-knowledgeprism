import { HTTPCode } from "@knowledgeprism/constants";
import {
	type RegisterRequestDto,
	type UserGetAllResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";
import argon2 from "argon2";
import { type Transaction, UniqueViolationError } from "objection";

import { HTTPError } from "~/infrastructure/http/http.js";
import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserRepository } from "~/modules/users/repositories/user.repository.js";
import { type Service } from "~/shared/types/types.js";

const EMAIL_ALREADY_EXISTS_MESSAGE = "Email already exists";

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

	public async createOrganisationAdmin(
		payload: RegisterRequestDto & {
			organisationId: number;
		},
		transaction: Transaction,
	): Promise<UserEntity> {
		const user = await this.userRepository.findByEmail(
			payload.email,
			transaction,
		);

		if (user) {
			throw new HTTPError({
				message: EMAIL_ALREADY_EXISTS_MESSAGE,
				status: HTTPCode.CONFLICT,
			});
		}

		const passwordHash = await argon2.hash(payload.password, {
			type: argon2.argon2id,
		});

		try {
			return await this.userRepository.create(
				UserEntity.initializeNew({
					email: payload.email,
					firstName: payload.firstName,
					lastName: payload.lastName,
					organisationId: payload.organisationId,
					passwordHash,
				}),
				transaction,
			);
		} catch (error) {
			if (error instanceof UniqueViolationError) {
				throw new HTTPError({
					cause: error,
					message: EMAIL_ALREADY_EXISTS_MESSAGE,
					status: HTTPCode.CONFLICT,
				});
			}

			throw error;
		}
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
