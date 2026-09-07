import { APIPath, DocumentsApiPath, HTTPCode } from "@knowledgeprism/constants";
import { manualTextCreateValidationSchema } from "@knowledgeprism/schemas";
import {
	type ManualTextCreateRequestDto,
	type ManualTextRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	getRequiredUserId,
	parseIdentifier,
} from "~/modules/documents/libs/helpers/parse-identifier.helper.js";
import { type DocumentService } from "~/modules/documents/services/document.service.js";

class DocumentController extends BaseController {
	private documentService: DocumentService;

	public constructor(logger: Logger, documentService: DocumentService) {
		super(logger, APIPath.PROJECTS);

		this.documentService = documentService;

		this.addRoute({
			handler: (options) =>
				this.createManualText(
					options as APIHandlerOptions<{
						body: ManualTextCreateRequestDto;
						params: ManualTextRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.MANUAL_TEXT,
			validation: {
				body: manualTextCreateValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.findManualText(
					options as APIHandlerOptions<{
						params: ManualTextRouteParametersDto;
					}>,
				),
			method: "GET",
			path: DocumentsApiPath.MANUAL_TEXT_$ID,
		});
		this.addRoute({
			handler: (options) =>
				this.retryManualText(
					options as APIHandlerOptions<{
						params: ManualTextRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.RETRY,
		});
		this.addRoute({
			handler: (options) =>
				this.cancelManualText(
					options as APIHandlerOptions<{
						params: ManualTextRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.CANCEL,
		});
	}

	/**
	 * @swagger
	 * /projects/{projectId}/manual-text/{id}/cancel:
	 *    post:
	 *      description: Cancel a processing or failed manual text document
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
	 *      responses:
	 *        200:
	 *          description: Document cancelled
	 */
	private async cancelManualText(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { id, projectId, userId } = this.getRouteContext(options);

		return {
			payload: await this.documentService.cancelManualText({
				id,
				projectId,
				userId,
			}),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/manual-text:
	 *    post:
	 *      description: Submit manual text for processing
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              type: object
	 *              required:
	 *                - content
	 *              properties:
	 *                title:
	 *                  type: string
	 *                  maxLength: 255
	 *                content:
	 *                  type: string
	 *      responses:
	 *        202:
	 *          description: Processing started
	 *        401:
	 *          description: Unauthorized
	 *        403:
	 *          description: Viewer or outsider cannot add knowledge
	 *        422:
	 *          description: Invalid title or content
	 */
	private async createManualText(
		options: APIHandlerOptions<{
			body: ManualTextCreateRequestDto;
			params: ManualTextRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { projectId, userId } = this.getProjectContext(options);

		return {
			payload: await this.documentService.createManualText({
				payload: options.body,
				projectId,
				userId,
			}),
			status: HTTPCode.ACCEPTED,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/manual-text/{id}:
	 *    get:
	 *      description: Get manual text processing status
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
	 *      responses:
	 *        200:
	 *          description: Document status
	 */
	private async findManualText(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { id, projectId, userId } = this.getRouteContext(options);

		return {
			payload: await this.documentService.findManualText({
				id,
				projectId,
				userId,
			}),
			status: HTTPCode.OK,
		};
	}

	private getProjectContext(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): {
		projectId: number;
		userId: number;
	} {
		return {
			projectId: parseIdentifier(options.params.projectId),
			userId: getRequiredUserId(options.session.userId),
		};
	}

	private getRouteContext(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): {
		id: number;
		projectId: number;
		userId: number;
	} {
		const { projectId, userId } = this.getProjectContext(options);

		return {
			id: parseIdentifier(options.params.id ?? ""),
			projectId,
			userId,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/manual-text/{id}/retry:
	 *    post:
	 *      description: Retry a failed manual text processing attempt
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
	 *      responses:
	 *        200:
	 *          description: Processing restarted
	 */
	private async retryManualText(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { id, projectId, userId } = this.getRouteContext(options);

		return {
			payload: await this.documentService.retryManualText({
				id,
				projectId,
				userId,
			}),
			status: HTTPCode.OK,
		};
	}
}

export { DocumentController };
