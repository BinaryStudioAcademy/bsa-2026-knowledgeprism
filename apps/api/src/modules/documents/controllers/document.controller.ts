import { APIPath, DocumentsApiPath } from "@knowledgeprism/constants";
import {
	documentUploadIntentRouteParametersValidationSchema,
	documentUploadIntentValidationSchema,
	manualTextCreateValidationSchema,
	manualTextRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentRouteParametersDto,
	type ManualTextCreateRequestDto,
	type ManualTextRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	getRequiredUserId,
	parseIdentifier,
} from "~/modules/documents/libs/helpers/parse-identifier.helper.js";
import { type DocumentService } from "~/modules/documents/services/document.service.js";

/**
 * @swagger
 * components:
 *    schemas:
 *      DocumentUploadIntentRequest:
 *        type: object
 *        required:
 *          - fileName
 *          - contentType
 *        properties:
 *          fileName:
 *            type: string
 *            example: Project_A_Requirements.pdf
 *          contentType:
 *            type: string
 *            enum:
 *              - application/pdf
 *          sizeInBytes:
 *            type: number
 *            example: 1048576
 *      DocumentUploadIntentResponse:
 *        type: object
 *        properties:
 *          documentId:
 *            type: number
 *            example: 1
 *          uploadUrl:
 *            type: string
 *            example: https://s3.amazonaws.com/bucket/key
 *          storageKey:
 *            type: string
 *            example: projects/project-1/docs/1788354738034-25181d2e-7f78-4e6b-9a8f-f8da61fdc7b5-file.pdf
 *          expiresInSeconds:
 *            type: number
 *            example: 900
 */
class DocumentController extends BaseController {
	private documentService: DocumentService;

	public constructor(logger: Logger, documentService: DocumentService) {
		super(logger, APIPath.PROJECTS);

		this.documentService = documentService;

		this.addRoute({
			handler: (options) =>
				this.createUploadIntent(
					options as APIHandlerOptions<{
						body: DocumentUploadIntentRequestDto;
						params: DocumentUploadIntentRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.UPLOAD_URL,
			validation: {
				body: documentUploadIntentValidationSchema,
				params: documentUploadIntentRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.createManualText(
					options as APIHandlerOptions<{
						body: ManualTextCreateRequestDto;
						params: DocumentUploadIntentRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.MANUAL_TEXT,
			validation: {
				body: manualTextCreateValidationSchema,
				params: documentUploadIntentRouteParametersValidationSchema,
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
			validation: {
				params: manualTextRouteParametersValidationSchema,
			},
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
			validation: {
				params: manualTextRouteParametersValidationSchema,
			},
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
			validation: {
				params: manualTextRouteParametersValidationSchema,
			},
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
	 *            type: string
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
	 *            type: string
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
			params: DocumentUploadIntentRouteParametersDto;
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
	 * /projects/{projectId}/documents/upload-url:
	 *    post:
	 *      description: Create a document upload intent and return a presigned S3 upload URL
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: string
	 *      requestBody:
	 *        required: true
	 *        content:
	 *          application/json:
	 *            schema:
	 *              $ref: "#/components/schemas/DocumentUploadIntentRequest"
	 *      responses:
	 *        201:
	 *          description: Upload intent created
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/DocumentUploadIntentResponse"
	 */
	private async createUploadIntent(
		options: APIHandlerOptions<{
			body: DocumentUploadIntentRequestDto;
			params: DocumentUploadIntentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentService.createUploadIntent({
				payload: options.body,
				routeParameters: options.params,
			}),
			status: HTTPCode.CREATED,
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
	 *            type: string
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
			params: DocumentUploadIntentRouteParametersDto;
		}>,
	): {
		projectId: string;
		userId: number;
	} {
		return {
			projectId: options.params.projectId,
			userId: getRequiredUserId(options.session.userId),
		};
	}

	private getRouteContext(
		options: APIHandlerOptions<{
			params: ManualTextRouteParametersDto;
		}>,
	): {
		id: number;
		projectId: string;
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
	 *            type: string
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
