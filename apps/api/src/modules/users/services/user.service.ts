import { HTTPCode, UserValidationMessage } from "@knowledgeprism/constants";
import {
	type UserCreateRequestDto,
	type UserDetailsResponseDto,
	type UserGetAllItemResponseDto,
	type UserGetAllResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
	type UserUpdateRequestDto,
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

	private guardSelfModification(
		id: number,
		currentUserId: number,
		payload: UserUpdateRequestDto,
	): void {
		if (id !== currentUserId) {
			return;
		}

		if (payload.status) {
			throw new HTTPError({
				message: UserValidationMessage.USER_CANNOT_UPDATE_STATUS,
				status: HTTPCode.BAD_REQUEST,
			});
		}

		if (payload.email) {
			throw new HTTPError({
				message: UserValidationMessage.USER_CANNOT_UPDATE_EMAIL,
				status: HTTPCode.BAD_REQUEST,
			});
		}

		if (payload.assignedProjects) {
			throw new HTTPError({
				message: UserValidationMessage.USER_CANNOT_REMOVE_SELF_FROM_PROJECTS,
				status: HTTPCode.BAD_REQUEST,
			});
		}
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
					status: "active",
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

	public async createOrgUser(
		payload: UserCreateRequestDto,
		organisationId: number,
	): Promise<UserDetailsResponseDto> {
		const existingUser = await this.userRepository.findByEmail(payload.email);

		if (existingUser) {
			throw new HTTPError({
				message: UserValidationMessage.EMAIL_ALREADY_EXISTS,
				status: HTTPCode.CONFLICT,
			});
		}

		const passwordHash = await this.encryptService.generateHash(
			payload.password,
		);

		const item = await this.userRepository.createOrgUser(
			UserEntity.initializeNew({
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				organisationId,
				passwordHash,
				status: "active",
			}),
			payload.assignedProjects,
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

	public async findAllByOrgId(
		organisationId: number,
	): Promise<{ items: UserGetAllItemResponseDto[] }> {
		const items = await this.userRepository.findAllByOrgId(organisationId);

		return {
			items: items.map((item) => item.toObject()),
		};
	}

	public async findDetailsById(
		id: number,
		organisationId: number,
	): Promise<UserDetailsResponseDto> {
		const item = await this.userRepository.findDetailsById(id, organisationId);

		if (!item) {
			throw new HTTPError({
				message: UserValidationMessage.USER_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return item.toObject();
	}

	public async findByEmail(email: string): Promise<null | UserEntity> {
		return await this.userRepository.findByEmail(email);
	}

	public async findById(id: number): Promise<null | UserEntity> {
		return await this.userRepository.findById(id);
	}

	public update(): ReturnType<Service["update"]> {
		return Promise.resolve(null);
	}

	public async updateOrgUser({
		currentUserId,
		id,
		organisationId,
		payload,
	}: {
		currentUserId: number;
		id: number;
		organisationId: number;
		payload: UserUpdateRequestDto;
	}): Promise<UserDetailsResponseDto> {
		const existingUser = await this.userRepository.findDetailsById(
			id,
			organisationId,
		);

		if (!existingUser) {
			throw new HTTPError({
				message: UserValidationMessage.USER_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		this.guardSelfModification(id, currentUserId, payload);

		const entity: Partial<ReturnType<UserEntity["toNewObject"]>> = {
			...(payload.email !== undefined && { email: payload.email }),
			...(payload.firstName !== undefined && { firstName: payload.firstName }),
			...(payload.lastName !== undefined && { lastName: payload.lastName }),
			...(payload.status !== undefined && { status: payload.status }),
		};

		if (payload.password) {
			entity.passwordHash = await this.encryptService.generateHash(
				payload.password,
			);
		}

		if (payload.email && payload.email !== existingUser.toObject().email) {
			const emailTaken = await this.userRepository.findByEmail(payload.email);
			if (emailTaken) {
				throw new HTTPError({
					message: UserValidationMessage.EMAIL_ALREADY_EXISTS,
					status: HTTPCode.CONFLICT,
				});
			}
		}

		const updatedUser = await this.userRepository.updateOrgUser({
			...(payload.assignedProjects && {
				assignedProjects: payload.assignedProjects,
			}),
			entity,
			id,
			organisationId,
		});

		if (!updatedUser) {
			throw new HTTPError({
				message: UserValidationMessage.USER_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return updatedUser.toObject();
	}
}

export { UserService };
