import { APIPath, DocumentsApiPath } from "@knowledgeprism/constants";
import {
	documentRouteParametersValidationSchema,
	extractionItemRouteParametersValidationSchema,
	extractionItemsReviewValidationSchema,
	extractionItemUpdateValidationSchema,
	integrationChangesApplyValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type DocumentRouteParametersDto,
	type ExtractionItemRouteParametersDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemUpdateRequestDto,
	type IntegrationChangesApplyRequestDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { parseIdentifier } from "~/modules/documents/libs/helpers/parse-identifier.helper.js";
import {
	type DocumentReference,
	type DocumentReviewService,
} from "~/modules/documents/services/document-review.service.js";

class DocumentReviewController extends BaseController {
	private documentReviewService: DocumentReviewService;

	public constructor(
		logger: Logger,
		documentReviewService: DocumentReviewService,
	) {
		super(logger, APIPath.PROJECTS);

		this.documentReviewService = documentReviewService;

		this.addRoute({
			handler: (options) =>
				this.findStatus(
					options as APIHandlerOptions<{
						params: DocumentRouteParametersDto;
					}>,
				),
			method: "GET",
			path: DocumentsApiPath.DOCUMENT_$ID,
			validation: {
				params: documentRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.findItems(
					options as APIHandlerOptions<{
						params: DocumentRouteParametersDto;
					}>,
				),
			method: "GET",
			path: DocumentsApiPath.EXTRACTION_ITEMS,
			validation: {
				params: documentRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.updateItem(
					options as APIHandlerOptions<{
						body: ExtractionItemUpdateRequestDto;
						params: ExtractionItemRouteParametersDto;
					}>,
				),
			method: "PATCH",
			path: DocumentsApiPath.EXTRACTION_ITEMS_$ID,
			validation: {
				body: extractionItemUpdateValidationSchema,
				params: extractionItemRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.review(
					options as APIHandlerOptions<{
						body: ExtractionItemsReviewRequestDto;
						params: DocumentRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.EXTRACTION_ITEMS_REVIEW,
			validation: {
				body: extractionItemsReviewValidationSchema,
				params: documentRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.findIntegrationChanges(
					options as APIHandlerOptions<{
						params: DocumentRouteParametersDto;
					}>,
				),
			method: "GET",
			path: DocumentsApiPath.INTEGRATION_CHANGES,
			validation: {
				params: documentRouteParametersValidationSchema,
			},
		});
		this.addRoute({
			handler: (options) =>
				this.applyIntegrationChanges(
					options as APIHandlerOptions<{
						body: IntegrationChangesApplyRequestDto;
						params: DocumentRouteParametersDto;
					}>,
				),
			method: "POST",
			path: DocumentsApiPath.INTEGRATION_CHANGES_APPLY,
			validation: {
				body: integrationChangesApplyValidationSchema,
				params: documentRouteParametersValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /projects/{projectId}/documents/{documentId}/integration-changes/apply:
	 *    post:
	 *      description: Approve the integration results and write them to the knowledge base in one transaction. NEW creates entries, UPDATE replaces the matched entry's content, DUPLICATE writes nothing, CONFLICT applies the chosen value per field.
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: documentId
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
	 *                - resolutions
	 *              properties:
	 *                resolutions:
	 *                  type: array
	 *                  description: Exactly one entry per CONFLICT change
	 *                  items:
	 *                    type: object
	 *                    required:
	 *                      - changeId
	 *                      - title
	 *                      - content
	 *                    properties:
	 *                      changeId:
	 *                        type: integer
	 *                        example: 7
	 *                      title:
	 *                        type: string
	 *                        enum: [keep, use-new]
	 *                      content:
	 *                        type: string
	 *                        enum: [keep, use-new]
	 *      responses:
	 *        200:
	 *          description: Changes applied; document completed
	 *        400:
	 *          description: Resolutions do not match the conflicts
	 *        403:
	 *          description: Viewer cannot approve
	 *        404:
	 *          description: Document not found
	 *        409:
	 *          description: Document is not waiting for approval
	 */
	private async applyIntegrationChanges(
		options: APIHandlerOptions<{
			body: IntegrationChangesApplyRequestDto;
			params: DocumentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.applyIntegrationChanges({
				...this.getDocumentReference(options),
				payload: options.body,
			}),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/documents/{documentId}/integration-changes:
	 *    get:
	 *      description: List the integration analysis results of a document (NEW, UPDATE, DUPLICATE or CONFLICT for each approved item)
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: documentId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *      responses:
	 *        200:
	 *          description: Integration changes
	 *        403:
	 *          description: User is not a member of the project
	 *        404:
	 *          description: Document not found
	 */
	private async findIntegrationChanges(
		options: APIHandlerOptions<{
			params: DocumentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.findIntegrationChanges(
				this.getDocumentReference(options),
			),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/documents/{documentId}/extraction-items:
	 *    get:
	 *      description: List the AI-extracted items of a document
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: documentId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *      responses:
	 *        200:
	 *          description: Extraction items
	 *        403:
	 *          description: User is not a member of the project
	 *        404:
	 *          description: Document not found
	 */
	private async findItems(
		options: APIHandlerOptions<{
			params: DocumentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.findItems(
				this.getDocumentReference(options),
			),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/documents/{documentId}:
	 *    get:
	 *      description: Get the processing status of a document
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: documentId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *      responses:
	 *        200:
	 *          description: Document status
	 *        403:
	 *          description: User is not a member of the project
	 *        404:
	 *          description: Document not found
	 */
	private async findStatus(
		options: APIHandlerOptions<{
			params: DocumentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.findStatus(
				this.getDocumentReference(options),
			),
			status: HTTPCode.OK,
		};
	}

	private getDocumentReference(
		options: APIHandlerOptions<{
			params: DocumentRouteParametersDto;
		}>,
	): DocumentReference {
		return {
			context: this.getAuthenticatedSessionContext(options),
			documentId: parseIdentifier(options.params.documentId),
			projectId: Number(options.params.projectId),
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/documents/{documentId}/extraction-items/review:
	 *    post:
	 *      description: Approve or reject every pending item. Approved items are sent to integration analysis; if every item is rejected the document is completed.
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: path
	 *          name: documentId
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
	 *                - approvedIds
	 *                - rejectedIds
	 *              properties:
	 *                approvedIds:
	 *                  type: array
	 *                  items:
	 *                    type: integer
	 *                  example: [1, 2]
	 *                rejectedIds:
	 *                  type: array
	 *                  items:
	 *                    type: integer
	 *                  example: [3]
	 *      responses:
	 *        200:
	 *          description: Review applied
	 *        400:
	 *          description: Items do not match the pending items
	 *        403:
	 *          description: Viewer cannot approve
	 *        409:
	 *          description: Document is not waiting for validation
	 */

	private async review(
		options: APIHandlerOptions<{
			body: ExtractionItemsReviewRequestDto;
			params: DocumentRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.review({
				...this.getDocumentReference(options),
				payload: options.body,
			}),
			status: HTTPCode.OK,
		};
	}

	private async updateItem(
		options: APIHandlerOptions<{
			body: ExtractionItemUpdateRequestDto;
			params: ExtractionItemRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.documentReviewService.updateItem({
				...this.getDocumentReference(options),
				id: parseIdentifier(options.params.id),
				payload: options.body,
			}),
			status: HTTPCode.OK,
		};
	}
}

export { DocumentReviewController };
