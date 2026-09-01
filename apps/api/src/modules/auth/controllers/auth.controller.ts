import { AuthApiPath } from "@knowledgeprism/constants";
import {
	userSignInValidationSchema,
	userSignUpValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type UserSignInRequestDto,
	type UserSignUpRequestDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { APIPath } from "~/shared/enums/enums.js";

import { type AuthService } from "../services/auth.service.js";

const UNAUTHORIZED_MESSAGE = "Unauthorized";

class AuthController extends BaseController {
	private authService: AuthService;

	public constructor(logger: Logger, authService: AuthService) {
		super(logger, APIPath.AUTH);

		this.authService = authService;

		this.addRoute({
			handler: (options) => this.getCurrentUser(options),
			method: "GET",
			path: AuthApiPath.ME,
		});
		this.addRoute({
			handler: (options) => this.logOut(options),
			method: "POST",
			path: AuthApiPath.LOG_OUT,
		});
		this.addRoute({
			handler: (options) =>
				this.signIn(
					options as APIHandlerOptions<{
						body: UserSignInRequestDto;
					}>,
				),
			method: "POST",
			path: AuthApiPath.SIGN_IN,
			validation: {
				body: userSignInValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.signUp(
					options as APIHandlerOptions<{
						body: UserSignUpRequestDto;
					}>,
				),
			method: "POST",
			path: AuthApiPath.SIGN_UP,
			validation: {
				body: userSignUpValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /auth/me:
	 *    get:
	 *      description: Get currently authenticated user
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 *        401:
	 *          description: Not authenticated
	 */
	private async getCurrentUser(
		options: APIHandlerOptions,
	): Promise<APIHandlerResponse> {
		const userId = options.session.userId;

		if (!userId) {
			throw new HTTPError({
				message: UNAUTHORIZED_MESSAGE,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			payload: await this.authService.getCurrentUser(userId),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /auth/logout:
	 *    post:
	 *      description: Log out current user, destroying the session
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 */
	private async logOut(
		options: APIHandlerOptions,
	): Promise<APIHandlerResponse> {
		await options.session.destroy();

		return {
			payload: { message: "Logged out successfully" },
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /auth/sign-in:
	 *    post:
	 *      description: Sign in to the application
	 *      requestBody:
	 *        description: User credentials
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              properties:
	 *                email:
	 *                  type: string
	 *                  format: email
	 *                password:
	 *                  type: string
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 */
	private async signIn(
		options: APIHandlerOptions<{
			body: UserSignInRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		const result = await this.authService.signIn(options.body);
		options.session.userId = result.user.id;
		await options.session.regenerate(["userId"]);

		return {
			payload: result,
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /auth/sign-up:
	 *    post:
	 *      description: Register organisation and admin user
	 *      requestBody:
	 *        description: Organisation and admin user data
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              properties:
	 *                organisationName:
	 *                  type: string
	 *                firstName:
	 *                  type: string
	 *                lastName:
	 *                  type: string
	 *                email:
	 *                  type: string
	 *                  format: email
	 *                password:
	 *                  type: string
	 *      responses:
	 *        201:
	 *          description: Successful operation
	 */
	private async signUp(
		options: APIHandlerOptions<{
			body: UserSignUpRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		const result = await this.authService.signUp(options.body);
		options.session.userId = result.user.id;
		await options.session.regenerate(["userId"]);

		return {
			payload: result,
			status: HTTPCode.CREATED,
		};
	}
}

export { AuthController };
