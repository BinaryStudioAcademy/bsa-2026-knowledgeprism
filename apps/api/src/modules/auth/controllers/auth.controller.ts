import { AuthApiPath } from "@knowledgeprism/constants";
import {
	registerValidationSchema,
	userSignUpValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type RegisterRequestDto,
	type UserSignUpRequestDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { APIPath } from "~/shared/enums/enums.js";

import { type AuthService } from "../services/auth.service.js";

class AuthController extends BaseController {
	private authService: AuthService;

	public constructor(logger: Logger, authService: AuthService) {
		super(logger, APIPath.AUTH);

		this.authService = authService;

		this.addRoute({
			handler: (options) =>
				this.register(
					options as APIHandlerOptions<{
						body: RegisterRequestDto;
					}>,
				),
			method: "POST",
			path: AuthApiPath.REGISTER,
			validation: {
				body: registerValidationSchema,
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
	 * /auth/register:
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
	private async register(
		options: APIHandlerOptions<{
			body: RegisterRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.authService.register(options.body),
			status: HTTPCode.CREATED,
		};
	}

	/**
	 * @swagger
	 * /auth/sign-up:
	 *    post:
	 *      description: Sign up user into the system
	 *      requestBody:
	 *        description: User auth data
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
	 *        201:
	 *          description: Successful operation
	 *          content:
	 *            application/json:
	 *              schema:
	 *                type: object
	 *                properties:
	 *                  message:
	 *                    type: object
	 *                    $ref: "#/components/schemas/User"
	 */
	private async signUp(
		options: APIHandlerOptions<{
			body: UserSignUpRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.authService.signUp(options.body),
			status: HTTPCode.CREATED,
		};
	}
}

export { AuthController };
