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
import argon2 from "argon2";

import { HTTPError } from "~/infrastructure/http/libs/exceptions/exceptions.js";
import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserRepository } from "~/modules/users/repositories/user.repository.js";
import { type Service } from "~/shared/types/types.js";

class UserService implements Service {
	private userRepository: UserRepository;

	public constructor(userRepository: UserRepository) {
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

		if (payload.status === "inactive") {
			throw new HTTPError({
				message: UserValidationMessage.USER_CANNOT_DEACTIVATE_SELF,
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

	public async create(
		payload: UserSignUpRequestDto,
	): Promise<UserSignUpResponseDto> {
		const passwordHash = await argon2.hash(payload.password, {
			type: argon2.argon2id,
		});

		const item = await this.userRepository.create(
			UserEntity.initializeNew({
				email: payload.email,
				firstName: null,
				lastName: null,
				organisationId: null,
				passwordHash,
				status: "active",
			}),
		);

		return item.toObject();
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

		const passwordHash = await argon2.hash(payload.password, {
			type: argon2.argon2id,
		});

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
			entity.passwordHash = await argon2.hash(payload.password, {
				type: argon2.argon2id,
			});
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
