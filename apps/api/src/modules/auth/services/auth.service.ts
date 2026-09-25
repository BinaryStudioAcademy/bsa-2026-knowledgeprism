import {
	AuthValidationMessage,
	UserStatus,
	UserValidationMessage,
} from "@knowledgeprism/constants";
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
import { type OrganisationService } from "~/modules/organisations/services/organisation.service.js";
import { type UserService } from "~/modules/users/services/user.service.js";

type Constructor = {
	database: Database;
	encryptService: EncryptService;
	organisationService: OrganisationService;
	userService: UserService;
};

class AuthService {
	private database: Database;
	private encryptService: EncryptService;
	private organisationService: OrganisationService;
	private userService: UserService;

	public constructor({
		database,
		encryptService,
		organisationService,
		userService,
	}: Constructor) {
		this.database = database;
		this.encryptService = encryptService;
		this.organisationService = organisationService;
		this.userService = userService;
	}

	public async getCurrentUser(
		userId: number,
	): Promise<UserGetCurrentResponseDto> {
		const user = await this.userService.findById(userId);

		if (!user) {
			throw new HTTPError({
				message: AuthValidationMessage.UNAUTHORIZED,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const userDetails = user.toObject();
		const organisation = await this.organisationService.find(
			userDetails.organisationId,
		);

		if (!organisation) {
			throw new HTTPError({
				message: AuthValidationMessage.UNAUTHORIZED,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			organisation: organisation.toObject(),
			user: user.toAuthObject(),
		};
	}

	public async signIn(
		payload: UserSignInRequestDto,
	): Promise<UserSignInResponseDto> {
		const user = await this.userService.findByEmail(payload.email);

		if (!user) {
			throw new HTTPError({
				message: "Incorrect email or password. Please try again.",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const isPasswordValid = await user.validatePassword(
			payload.password,
			this.encryptService,
		);

		if (!isPasswordValid) {
			throw new HTTPError({
				message: "Incorrect email or password. Please try again.",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		const userDetails = user.toObject();
		if (userDetails.status === UserStatus.INACTIVE) {
			throw new HTTPError({
				message: UserValidationMessage.USER_INACTIVE,
				status: HTTPCode.FORBIDDEN,
			});
		}

		const organisation = await this.organisationService.find(
			userDetails.organisationId,
		);

		if (!organisation) {
			throw new HTTPError({
				message: "No organization was found for user",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			organisation: organisation.toObject(),
			user: user.toAuthObject(),
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
			const organisationDetails = organisation.toObject();
			const user = await this.userService.createOrganisationAdmin(
				{
					...payload,
					organisationId: organisationDetails.id,
				},
				transaction,
			);

			return {
				organisation: organisationDetails,
				user: user.toAuthObject(),
			};
		});
	}
}

export { AuthService };
