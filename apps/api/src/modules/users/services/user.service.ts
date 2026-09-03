import { HTTPCode } from "@knowledgeprism/constants";
import {
	type UserGetAllResponseDto,
	type UserSignUpRequestDto,
} from "@knowledgeprism/types";
import { type Transaction, UniqueViolationError } from "objection";

import { HTTPError } from "~/infrastructure/http/http.js";
import { type EncryptService } from "~/libs/services/encrypt/encrypt.service.js";
import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserRepository } from "~/modules/users/repositories/user.repository.js";
import { type Service } from "~/shared/types/types.js";

const EMAIL_ALREADY_EXISTS_MESSAGE = "Email already exists";

class UserService implements Service {
	private encryptService: EncryptService;

	private userRepository: UserRepository;

	public constructor(
		encryptService: EncryptService,
		userRepository: UserRepository,
	) {
		this.encryptService = encryptService;
		this.userRepository = userRepository;
	}

	public create(): ReturnType<Service["create"]> {
		return Promise.resolve(null);
	}

	public async createOrganisationAdmin(
		payload: UserSignUpRequestDto & {
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

		const passwordHash = await this.encryptService.generateHash(
			payload.password,
		);

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

	public async findByEmail(email: string): Promise<null | UserEntity> {
		return await this.userRepository.findByEmail(email);
	}

	public update(): ReturnType<Service["update"]> {
		return Promise.resolve(null);
	}
}

export { UserService };
