import {
	type UserGetCurrentResponseDto,
	type UserSignInRequestDto,
	type UserSignInResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type EncryptService } from "~/libs/services/encrypt/encrypt.service.js";
import { type TokenService } from "~/libs/services/token/token.service.js";
import { type OrganisationService } from "~/modules/organisations/services/organisation.service.js";
import { type UserService } from "~/modules/users/services/user.service.js";

type Constructor = {
	database: Database;
	encryptService: EncryptService;
	organisationService: OrganisationService;
	tokenService: TokenService;
	userService: UserService;
};

const UNAUTHORIZED_MESSAGE = "Unauthorized";

class AuthService {
	private database: Database;
	private encryptService: EncryptService;
	private organisationService: OrganisationService;
	private tokenService: TokenService;
	private userService: UserService;

	public constructor({
		database,
		encryptService,
		organisationService,
		tokenService,
		userService,
	}: Constructor) {
		this.database = database;
		this.encryptService = encryptService;
		this.organisationService = organisationService;
		this.tokenService = tokenService;
		this.userService = userService;
	}

	public async getCurrentUser(
		userId: number,
	): Promise<UserGetCurrentResponseDto> {
		const user = await this.userService.findById(userId);

		if (!user) {
			throw new HTTPError({
				message: UNAUTHORIZED_MESSAGE,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const userObject = user.toObject();
		const organisation = await this.organisationService.find(
			userObject.organisationId,
		);

		if (!organisation) {
			throw new HTTPError({
				message: UNAUTHORIZED_MESSAGE,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			organisation: organisation.toObject(),
			user: {
				email: userObject.email,
				firstName: userObject.firstName,
				id: userObject.id,
				lastName: userObject.lastName,
			},
		};
	}

	public async signIn(
		payload: UserSignInRequestDto,
	): Promise<UserSignInResponseDto> {
		const user = await this.userService.findByEmail(payload.email);

		if (!user) {
			throw new HTTPError({
				message: "Invalid email or password",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const isPasswordValid = await this.encryptService.compare({
			data: payload.password,
			hash: user.passwordHash,
		});

		if (!isPasswordValid) {
			throw new HTTPError({
				message: "Invalid email or password",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const userObject = user.toObject();
		const organisation = await this.organisationService.find(
			userObject.organisationId,
		);

		if (!organisation) {
			throw new HTTPError({
				message: "Invalid email or password",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const token = await this.tokenService.createToken();

		return {
			organisation: organisation.toObject(),
			token,
			user: {
				email: userObject.email,
				firstName: userObject.firstName,
				id: userObject.id,
				lastName: userObject.lastName,
			},
		};
	}

	public signUp(payload: UserSignUpRequestDto): Promise<UserSignUpResponseDto> {
		return this.database.transaction(async (transaction) => {
			const organisation = await this.organisationService.create(
				{
					name: payload.organisationName,
				},
				transaction,
			);
			const organisationObject = organisation.toObject();
			const user = await this.userService.createOrganisationAdmin(
				{
					...payload,
					organisationId: organisationObject.id,
				},
				transaction,
			);

			return {
				organisation: organisationObject,
				user: user.toSignUpObject(),
			};
		});
	}
}

export { AuthService };
