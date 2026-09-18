import { APIPath, HTTPCode, KnowledgeApiPath } from "@knowledgeprism/constants";
import {
	knowledgeEntryRouteParametersValidationSchema,
	knowledgeEntryUpdateValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryRouteParametersDto,
	type KnowledgeEntryUpdateRequestDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type KnowledgeService } from "../services/knowledge.service.js";

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
 *            items:
 *              type: object
 *            example: [{"type": "paragraph", "content": []}]
 *      KnowledgeEntryResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: number
 *          projectId:
 *            type: number
 *          title:
 *            type: string
 *          contentJson:
 *            type: array
 *            items:
 *              type: object
 *            example: [{"type": "paragraph", "content": []}]
 *          createdAt:
 *            type: string
 *            format: date-time
 *          updatedAt:
 *            type: string
 *            format: date-time
 */
class KnowledgeController extends BaseController {
	private knowledgeService: KnowledgeService;

	public constructor(logger: Logger, knowledgeService: KnowledgeService) {
		super(logger, APIPath.PROJECTS);

		this.knowledgeService = knowledgeService;

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
		const updatedEntry: KnowledgeEntryResponseDto =
			await this.knowledgeService.updateEntry({
				context: this.getAuthenticatedSessionContext(options),
				entryId: Number(options.params.id),
				payload: options.body,
				projectId: Number(options.params.projectId),
			});

		return {
			payload: updatedEntry,
			status: HTTPCode.OK,
		};
	}
}

export { KnowledgeController };
