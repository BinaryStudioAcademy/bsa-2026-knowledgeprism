import { APIPath, UsersApiPath } from "@knowledgeprism/constants";
import {
	userCreateValidationSchema,
	userUpdateValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type UserCreateRequestDto,
	type UserUpdateRequestDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { type UserService } from "~/modules/users/services/user.service.js";

/**
 * @swagger
 * components:
 *    schemas:
 *      User:
 *        type: object
 *        properties:
 *          id:
 *            type: number
 *            format: number
 *            minimum: 1
 *          email:
 *            type: string
 *            format: email
 *          firstName:
 *            type: string
 *            nullable: true
 *          lastName:
 *            type: string
 *            nullable: true
 *          status:
 *            type: string
 *            enum: [active, inactive]
 *          organisationId:
 *            type: number
 *            nullable: true
 *      UserGetAllItem:
 *        type: object
 *        properties:
 *          id:
 *            type: number
 *          email:
 *            type: string
 *          firstName:
 *            type: string
 *            nullable: true
 *          lastName:
 *            type: string
 *            nullable: true
 *          status:
 *            type: string
 *            enum: [active, inactive]
 *          organisationId:
 *            type: number
 *            nullable: true
 *          assignedProjects:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                projectId:
 *                  type: number
 *                role:
 *                  type: string
 */
class UserController extends BaseController {
	private userService: UserService;

	public constructor(logger: Logger, userService: UserService) {
		super(logger, APIPath.USERS);

		this.userService = userService;

		// TODO: Apply RBAC Admin middleware here when implemented
		this.addRoute({
			handler: (options) =>
				this.createOrgUser(
					options as APIHandlerOptions<{
						body: UserCreateRequestDto;
					}>,
				),
			method: "POST",
			path: UsersApiPath.ROOT,
			validation: {
				body: userCreateValidationSchema,
			},
		});

		// TODO: Apply RBAC Admin middleware here when implemented
		this.addRoute({
			handler: (options) => this.findAllByOrgId(options),
			method: "GET",
			path: UsersApiPath.ROOT,
		});

		// TODO: Apply RBAC middleware (Admin OR Self) here when implemented
		this.addRoute({
			handler: (options) =>
				this.findDetailsById(
					options as APIHandlerOptions<{
						params: { id: string };
					}>,
				),
			method: "GET",
			path: UsersApiPath.ID,
		});

		// TODO: Apply RBAC middleware (Admin OR Self) here when implemented
		this.addRoute({
			handler: (options) =>
				this.updateOrgUser(
					options as APIHandlerOptions<{
						body: UserUpdateRequestDto;
						params: { id: string };
					}>,
				),
			method: "PATCH",
			path: UsersApiPath.ID,
			validation: {
				body: userUpdateValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /users:
	 *    post:
	 *      description: Create a new organisation user
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: "#/components/schemas/UserCreateRequestDto"
	 *      responses:
	 *        201:
	 *          description: Successful operation
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/User"
	 *        409:
	 *          description: Conflict (e.g. Email taken)
	 */
	private async createOrgUser(
		options: APIHandlerOptions<{
			body: UserCreateRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.userService.createOrgUser(
				options.body,
				options.session.organisationId,
			),
			status: HTTPCode.CREATED,
		};
	}

	/**
	 * @swagger
	 * /users:
	 *    get:
	 *      description: Returns an array of users for the current organisation
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 *          content:
	 *            application/json:
	 *              schema:
	 *                type: object
	 *                properties:
	 *                  items:
	 *                    type: array
	 *                    items:
	 *                      $ref: "#/components/schemas/UserGetAllItem"
	 */
	private async findAllByOrgId(
		options: APIHandlerOptions,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.userService.findAllByOrgId(
				options.session.organisationId,
			),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *    get:
	 *      description: Returns user details by id
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          required: true
	 *          schema:
	 *            type: number
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/User"
	 *        404:
	 *          description: User not found
	 */
	private async findDetailsById(
		options: APIHandlerOptions<{
			params: { id: string };
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.userService.findDetailsById(
				Number(options.params.id),
				options.session.organisationId,
			),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /users/{id}:
	 *    patch:
	 *      description: Update an organisation user
	 *      parameters:
	 *        - in: path
	 *          name: id
	 *          required: true
	 *          schema:
	 *            type: number
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: "#/components/schemas/UserUpdateRequestDto"
	 *      responses:
	 *        200:
	 *          description: Successful operation
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/User"
	 *        400:
	 *          description: Bad request (Self-edit restriction)
	 *        404:
	 *          description: User not found
	 *        409:
	 *          description: Conflict (Email taken)
	 */
	private async updateOrgUser(
		options: APIHandlerOptions<{
			body: UserUpdateRequestDto;
			params: { id: string };
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.userService.updateOrgUser({
				currentUserId: options.session.userId,
				id: Number(options.params.id),
				organisationId: options.session.organisationId,
				payload: options.body,
			}),
			status: HTTPCode.OK,
		};
	}
}

export { UserController };
