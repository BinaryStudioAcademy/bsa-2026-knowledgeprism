import {
	APIPath,
	AuthValidationMessage,
	HTTPCode,
	ProjectsApiPath,
} from "@knowledgeprism/constants";
import {
	projectCreateValidationSchema,
	projectMemberCreateValidationSchema,
	projectRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type ProjectCreateRequestDto,
	type ProjectMemberCreateRequestDto,
	type ProjectRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type ProjectService } from "../services/project.service.js";

type SessionContext = {
	organisationId: number;
	userId: number;
};

class ProjectController extends BaseController {
	/**
	 * @swagger
	 * tags:
	 *   - name: Projects
	 *     description: Organisation-scoped project management
	 * components:
	 *   securitySchemes:
	 *     sessionAuth:
	 *       type: apiKey
	 *       in: cookie
	 *       name: sessionId
	 *   parameters:
	 *     ProjectId:
	 *       in: path
	 *       name: id
	 *       required: true
	 *       description: Positive project ID, at most 2147483647
	 *       schema:
	 *         type: string
	 *         pattern: '^[1-9][0-9]*$'
	 *         maxLength: 10
	 *         example: '1'
	 *   responses:
	 *     ProjectUnauthorized:
	 *       description: Session is missing or unauthenticated
	 *     ProjectForbidden:
	 *       description: User is inactive or does not have permission
	 *     ProjectNotFound:
	 *       description: Project is absent from the current organisation
	 *     ProjectValidationFailed:
	 *       description: Request body or route parameters failed validation
	 *   schemas:
	 *     ProjectCreateRequest:
	 *       type: object
	 *       required: [name]
	 *       properties:
	 *         name: { type: string, minLength: 1, maxLength: 50, example: KnowledgePrism }
	 *         description: { type: string, example: Team knowledge base }
	 *     Project:
	 *       type: object
	 *       required: [id, name, description, createdAt, updatedAt]
	 *       properties:
	 *         id: { type: integer, minimum: 1, maximum: 2147483647 }
	 *         name: { type: string }
	 *         description: { type: string, nullable: true }
	 *         createdAt: { type: string, format: date-time }
	 *         updatedAt: { type: string, format: date-time }
	 *     ProjectMemberCreateRequest:
	 *       type: object
	 *       required: [userId, role]
	 *       properties:
	 *         userId: { type: integer, minimum: 1, maximum: 2147483647 }
	 *         role: { type: string, enum: [EDITOR, VIEWER] }
	 *     ProjectMember:
	 *       type: object
	 *       required: [userId, email, firstName, lastName, role, status]
	 *       properties:
	 *         userId: { type: integer }
	 *         email: { type: string, format: email }
	 *         firstName: { type: string, nullable: true }
	 *         lastName: { type: string, nullable: true }
	 *         role: { type: string, enum: [EDITOR, VIEWER] }
	 *         status: { type: string, enum: [active, inactive] }
	 *     ProjectMembers:
	 *       type: object
	 *       required: [items]
	 *       properties:
	 *         items:
	 *           type: array
	 *           items:
	 *             $ref: '#/components/schemas/ProjectMember'
	 * paths:
	 *   /projects:
	 *     post:
	 *       tags: [Projects]
	 *       summary: Create a project
	 *       description: Requires an active organisation administrator.
	 *       security:
	 *         - sessionAuth: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ProjectCreateRequest'
	 *       responses:
	 *         '201':
	 *           description: Project created
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/Project'
	 *         '401':
	 *           $ref: '#/components/responses/ProjectUnauthorized'
	 *         '403':
	 *           $ref: '#/components/responses/ProjectForbidden'
	 *         '422':
	 *           $ref: '#/components/responses/ProjectValidationFailed'
	 *   /projects/{id}:
	 *     parameters:
	 *       - $ref: '#/components/parameters/ProjectId'
	 *     get:
	 *       tags: [Projects]
	 *       summary: Get project details
	 *       description: Requires an active organisation administrator or project member.
	 *       security:
	 *         - sessionAuth: []
	 *       responses:
	 *         '200':
	 *           description: Project details
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/Project'
	 *         '401':
	 *           $ref: '#/components/responses/ProjectUnauthorized'
	 *         '403':
	 *           $ref: '#/components/responses/ProjectForbidden'
	 *         '404':
	 *           $ref: '#/components/responses/ProjectNotFound'
	 *         '422':
	 *           $ref: '#/components/responses/ProjectValidationFailed'
	 *     delete:
	 *       tags: [Projects]
	 *       summary: Delete a project
	 *       description: Requires an active organisation administrator. Projects containing documents cannot be deleted.
	 *       security:
	 *         - sessionAuth: []
	 *       responses:
	 *         '204':
	 *           description: Project deleted; response has no body
	 *         '401':
	 *           $ref: '#/components/responses/ProjectUnauthorized'
	 *         '403':
	 *           $ref: '#/components/responses/ProjectForbidden'
	 *         '404':
	 *           $ref: '#/components/responses/ProjectNotFound'
	 *         '409':
	 *           description: Project contains documents
	 *         '422':
	 *           $ref: '#/components/responses/ProjectValidationFailed'
	 *   /projects/{id}/members:
	 *     parameters:
	 *       - $ref: '#/components/parameters/ProjectId'
	 *     get:
	 *       tags: [Projects]
	 *       summary: List project members
	 *       description: Requires an active organisation administrator or project member. Returns EDITOR and VIEWER memberships.
	 *       security:
	 *         - sessionAuth: []
	 *       responses:
	 *         '200':
	 *           description: Project members
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ProjectMembers'
	 *         '401':
	 *           $ref: '#/components/responses/ProjectUnauthorized'
	 *         '403':
	 *           $ref: '#/components/responses/ProjectForbidden'
	 *         '404':
	 *           $ref: '#/components/responses/ProjectNotFound'
	 *         '422':
	 *           $ref: '#/components/responses/ProjectValidationFailed'
	 *     post:
	 *       tags: [Projects]
	 *       summary: Add a project member
	 *       description: Requires an active organisation administrator. The target user must belong to the same organisation.
	 *       security:
	 *         - sessionAuth: []
	 *       requestBody:
	 *         required: true
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ProjectMemberCreateRequest'
	 *       responses:
	 *         '201':
	 *           description: Project member added
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ProjectMember'
	 *         '401':
	 *           $ref: '#/components/responses/ProjectUnauthorized'
	 *         '403':
	 *           $ref: '#/components/responses/ProjectForbidden'
	 *         '404':
	 *           description: Project or target user is absent from the current organisation
	 *         '409':
	 *           description: User is already a project member
	 *         '422':
	 *           $ref: '#/components/responses/ProjectValidationFailed'
	 */
	private projectService: ProjectService;

	public constructor(logger: Logger, projectService: ProjectService) {
		super(logger, APIPath.PROJECTS);

		this.projectService = projectService;

		this.addRoute({
			handler: (options) =>
				this.create(
					options as APIHandlerOptions<{
						body: ProjectCreateRequestDto;
					}>,
				),
			method: "POST",
			path: ProjectsApiPath.ROOT,
			validation: {
				body: projectCreateValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.findById(
					options as APIHandlerOptions<{
						params: ProjectRouteParametersDto;
					}>,
				),
			method: "GET",
			path: ProjectsApiPath.ID,
			validation: {
				params: projectRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.findMembers(
					options as APIHandlerOptions<{
						params: ProjectRouteParametersDto;
					}>,
				),
			method: "GET",
			path: ProjectsApiPath.MEMBERS,
			validation: {
				params: projectRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.addMember(
					options as APIHandlerOptions<{
						body: ProjectMemberCreateRequestDto;
						params: ProjectRouteParametersDto;
					}>,
				),
			method: "POST",
			path: ProjectsApiPath.MEMBERS,
			validation: {
				body: projectMemberCreateValidationSchema,
				params: projectRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.delete(
					options as APIHandlerOptions<{
						params: ProjectRouteParametersDto;
					}>,
				),
			method: "DELETE",
			path: ProjectsApiPath.ID,
			validation: {
				params: projectRouteParametersValidationSchema,
			},
		});
	}

	private async addMember(
		options: APIHandlerOptions<{
			body: ProjectMemberCreateRequestDto;
			params: ProjectRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.projectService.addMember(
				Number(options.params.id),
				options.body,
				this.getSessionContext(options),
			),
			status: HTTPCode.CREATED,
		};
	}

	private async create(
		options: APIHandlerOptions<{
			body: ProjectCreateRequestDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.projectService.create(
				options.body,
				this.getSessionContext(options),
			),
			status: HTTPCode.CREATED,
		};
	}

	private async delete(
		options: APIHandlerOptions<{
			params: ProjectRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		await this.projectService.delete(
			Number(options.params.id),
			this.getSessionContext(options),
		);

		return {
			payload: null,
			status: HTTPCode.NO_CONTENT,
		};
	}

	private async findById(
		options: APIHandlerOptions<{
			params: ProjectRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.projectService.findById(
				Number(options.params.id),
				this.getSessionContext(options),
			),
			status: HTTPCode.OK,
		};
	}

	private async findMembers(
		options: APIHandlerOptions<{
			params: ProjectRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.projectService.findMembers(
				Number(options.params.id),
				this.getSessionContext(options),
			),
			status: HTTPCode.OK,
		};
	}

	private getSessionContext(options: APIHandlerOptions): SessionContext {
		const { organisationId, userId } = options.session;

		if (!organisationId || !userId) {
			throw new HTTPError({
				message: AuthValidationMessage.UNAUTHORIZED,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			organisationId,
			userId,
		};
	}
}

export { ProjectController };
