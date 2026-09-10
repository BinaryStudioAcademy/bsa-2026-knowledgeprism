import { APIPath, DocumentsApiPath } from "@knowledgeprism/constants";
import {
	documentUploadIntentRouteParametersValidationSchema,
	documentUploadIntentValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type DocumentService } from "../services/document.service.js";

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
}

export { DocumentController };
