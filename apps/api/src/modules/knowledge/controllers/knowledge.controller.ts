import {
	APIPath,
	AuthValidationMessage,
	HTTPCode,
	KnowledgeApiPath,
} from "@knowledgeprism/constants";
import {
	knowledgeEntryRouteParametersValidationSchema,
	knowledgeEntryUpdateValidationSchema,
	knowledgeTreeRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryRouteParametersDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeTreeRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type KnowledgeService } from "../services/knowledge.service.js";

type SessionContext = {
	organisationId: number;
	userId: number;
};

/**
 * @swagger
 * components:
 *    schemas:
 *      KnowledgeEntryUpdateRequest:
 *        type: object
 *        required:
 *          - title
 *          - contentJson
 *        properties:
 *          title:
 *            type: string
 *            maxLength: 255
 *            example: "Youth Center Grand Opening"
 *          contentJson:
 *            type: array
 *            nullable: true
 *            items:
 *              type: object
 *      KnowledgeEntryResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: number
 *          projectId:
 *            type: number
 *          parentId:
 *            type: number
 *            nullable: true
 *          position:
 *            type: number
 *          title:
 *            type: string
 *          type:
 *            type: string
 *            enum: [SECTION, PAGE, ENTRY]
 *          contentJson:
 *            type: array
 *            nullable: true
 *            items:
 *              type: object
 *          createdAt:
 *            type: string
 *            format: date-time
 *          updatedAt:
 *            type: string
 *            format: date-time
 *      KnowledgeTreeItemResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: number
 *          parentId:
 *            type: number
 *            nullable: true
 *          position:
 *            type: number
 *          title:
 *            type: string
 *          type:
 *            type: string
 *            enum: [SECTION, PAGE, ENTRY]
 *          updatedAt:
 *            type: string
 *            format: date-time
 *      KnowledgeTreeResponse:
 *        type: object
 *        properties:
 *          items:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/KnowledgeTreeItemResponse"
 */
class KnowledgeController extends BaseController {
	private knowledgeService: KnowledgeService;

	public constructor(logger: Logger, knowledgeService: KnowledgeService) {
		super(logger, APIPath.PROJECTS);

		this.knowledgeService = knowledgeService;

		this.addRoute({
			handler: (options) =>
				this.findTree(
					options as APIHandlerOptions<{
						params: KnowledgeTreeRouteParametersDto;
					}>,
				),
			method: "GET",
			path: KnowledgeApiPath.ROOT,
			validation: {
				params: knowledgeTreeRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.findEntry(
					options as APIHandlerOptions<{
						params: KnowledgeEntryRouteParametersDto;
					}>,
				),
			method: "GET",
			path: KnowledgeApiPath.ENTRY_$ID,
			validation: {
				params: knowledgeEntryRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.updateEntry(
					options as APIHandlerOptions<{
						body: KnowledgeEntryUpdateRequestDto;
						params: KnowledgeEntryRouteParametersDto;
					}>,
				),
			method: "PATCH",
			path: KnowledgeApiPath.ENTRY_$ID,
			validation: {
				body: knowledgeEntryUpdateValidationSchema,
				params: knowledgeEntryRouteParametersValidationSchema,
			},
		});
	}

	private async findEntry(
		options: APIHandlerOptions<{
			params: KnowledgeEntryRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { organisationId, userId } = this.getSessionContext(options);

		return {
			payload: await this.knowledgeService.findEntry({
				context: {
					organisationId,
					userId,
				},
				entryId: Number(options.params.id),
				projectId: Number(options.params.projectId),
			}),
			status: HTTPCode.OK,
		};
	}

	private async findTree(
		options: APIHandlerOptions<{
			params: KnowledgeTreeRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { organisationId, userId } = this.getSessionContext(options);

		return {
			payload: await this.knowledgeService.findTree({
				context: {
					organisationId,
					userId,
				},
				projectId: Number(options.params.projectId),
			}),
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

	/**
	 * @swagger
	 * /projects/{projectId}/knowledge/{id}:
	 *    patch:
	 *      description: Update a knowledge base entry's title and content
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: id
	 *          required: true
	 *          schema:
	 *            type: integer
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: "#/components/schemas/KnowledgeEntryUpdateRequest"
	 *      responses:
	 *        200:
	 *          description: Entry successfully updated
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/KnowledgeEntryResponse"
	 *        401:
	 *          description: Unauthorized
	 *        403:
	 *          description: Forbidden (Viewer role or non-member)
	 *        404:
	 *          description: Entry not found
	 *        422:
	 *          description: Validation error
	 */
	private async updateEntry(
		options: APIHandlerOptions<{
			body: KnowledgeEntryUpdateRequestDto;
			params: KnowledgeEntryRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { organisationId, userId } = this.getSessionContext(options);

		const updatedEntry: KnowledgeEntryResponseDto =
			await this.knowledgeService.updateEntry({
				context: {
					organisationId,
					userId,
				},
				entryId: Number(options.params.id),
				payload: options.body,
				projectId: Number(options.params.projectId),
				userId,
			});

		return {
			payload: updatedEntry,
			status: HTTPCode.OK,
		};
	}
}

export { KnowledgeController };
