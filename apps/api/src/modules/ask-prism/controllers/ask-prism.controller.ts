import { APIPath, AskPrismApiPath } from "@knowledgeprism/constants";
import {
	askPrismRequestValidationSchema,
	askPrismRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type AskPrismRequestDto,
	type AskPrismRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type AskPrismService } from "../services/ask-prism.service.js";

/**
 * @swagger
 * components:
 *    schemas:
 *      AskPrismRequest:
 *        type: object
 *        required:
 *          - query
 *        properties:
 *          query:
 *            type: string
 *      AskPrismResponse:
 *        type: object
 *        properties:
 *          answer:
 *            type: string
 *          sources:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                  type: number
 *                nodeId:
 *                  type: number
 *                sectionTitle:
 *                  type: string
 *                title:
 *                  type: string
 */
class AskPrismController extends BaseController {
	private askPrismService: AskPrismService;

	public constructor(logger: Logger, askPrismService: AskPrismService) {
		super(logger, APIPath.PROJECTS);

		this.askPrismService = askPrismService;

		this.addRoute({
			handler: (options) =>
				this.generateAnswer(
					options as APIHandlerOptions<{
						body: AskPrismRequestDto;
						params: AskPrismRouteParametersDto;
					}>,
				),
			method: "POST",
			path: AskPrismApiPath.ROOT,
			validation: {
				body: askPrismRequestValidationSchema,
				params: askPrismRouteParametersValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /projects/{projectId}/ask-prism:
	 *    post:
	 *      description: Ask a question and get a RAG-grounded answer based on project knowledge
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
	 *              $ref: "#/components/schemas/AskPrismRequest"
	 *      responses:
	 *        200:
	 *          description: Answer generated successfully
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/AskPrismResponse"
	 */
	private async generateAnswer(
		options: APIHandlerOptions<{
			body: AskPrismRequestDto;
			params: AskPrismRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		const { organisationId, userId } = options.session;

		if (!organisationId || !userId) {
			throw new HTTPError({
				message: "Unauthorized",
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		// TODO: Add basic rate limiting to protect GPU capacity as recommended in Technical Documentation

		return {
			payload: await this.askPrismService.generateAnswer(
				options.params.projectId,
				options.body.query,
				{ organisationId, userId },
			),
			status: HTTPCode.OK,
		};
	}
}

export { AskPrismController };
