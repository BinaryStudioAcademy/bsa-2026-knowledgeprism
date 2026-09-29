import { APIPath, GlossaryApiPath, HTTPCode } from "@knowledgeprism/constants";
import {
	glossaryConsistencyCheckRequestValidationSchema,
	glossaryRouteParametersValidationSchema,
	glossarySearchQueryValidationSchema,
	glossaryTermRequestValidationSchema,
	glossaryTermRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";
import {
	type GlossaryConsistencyCheckRequestDto,
	type GlossaryRouteParametersDto,
	type GlossarySearchQueryDto,
	type GlossaryTermRequestDto,
	type GlossaryTermRouteParametersDto,
} from "@knowledgeprism/types";

import {
	type APIHandlerOptions,
	type APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type GlossaryService } from "../services/glossary.service.js";

/**
 * @swagger
 * components:
 *    schemas:
 *      GlossaryTermRequest:
 *        type: object
 *        required:
 *          - name
 *          - definition
 *          - relatedTermIds
 *        properties:
 *          name:
 *            type: string
 *            maxLength: 100
 *            example: "Knowledge Base"
 *          definition:
 *            type: string
 *            maxLength: 1000
 *            example: "The approved, structured knowledge of a project."
 *          relatedTermIds:
 *            type: array
 *            maxItems: 20
 *            items:
 *              type: integer
 *            example: []
 *      GlossaryTermItem:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *          name:
 *            type: string
 *          definition:
 *            type: string
 *      GlossaryTermsResponse:
 *        type: object
 *        properties:
 *          items:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/GlossaryTermItem"
 *      GlossaryTermResponse:
 *        type: object
 *        properties:
 *          id:
 *            type: integer
 *          projectId:
 *            type: integer
 *          name:
 *            type: string
 *          definition:
 *            type: string
 *          relatedTerms:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                  type: integer
 *                name:
 *                  type: string
 *          createdAt:
 *            type: string
 *            format: date-time
 *          updatedAt:
 *            type: string
 *            format: date-time
 *      GlossaryConsistencyCheckRequest:
 *        type: object
 *        required:
 *          - content
 *        properties:
 *          content:
 *            type: string
 *            maxLength: 20000
 *      GlossaryConsistencyMatch:
 *        type: object
 *        properties:
 *          sourceExcerpt:
 *            type: string
 *          matchedTermId:
 *            type: integer
 *          canonicalName:
 *            type: string
 *          suggestedText:
 *            type: string
 *          explanation:
 *            type: string
 *      GlossaryConsistencyCheckResponse:
 *        type: object
 *        properties:
 *          matches:
 *            type: array
 *            items:
 *              $ref: "#/components/schemas/GlossaryConsistencyMatch"
 */
class GlossaryController extends BaseController {
	private glossaryService: GlossaryService;

	public constructor(logger: Logger, glossaryService: GlossaryService) {
		super(logger, APIPath.PROJECTS);

		this.glossaryService = glossaryService;

		this.addRoute({
			handler: (options) =>
				this.findAll(
					options as APIHandlerOptions<{
						params: GlossaryRouteParametersDto;
						query: GlossarySearchQueryDto;
					}>,
				),
			method: "GET",
			path: GlossaryApiPath.ROOT,
			validation: {
				params: glossaryRouteParametersValidationSchema,
				query: glossarySearchQueryValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.create(
					options as APIHandlerOptions<{
						body: GlossaryTermRequestDto;
						params: GlossaryRouteParametersDto;
					}>,
				),
			method: "POST",
			path: GlossaryApiPath.ROOT,
			validation: {
				body: glossaryTermRequestValidationSchema,
				params: glossaryRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.checkConsistency(
					options as APIHandlerOptions<{
						body: GlossaryConsistencyCheckRequestDto;
						params: GlossaryRouteParametersDto;
					}>,
				),
			method: "POST",
			path: GlossaryApiPath.CHECK_CONSISTENCY,
			validation: {
				body: glossaryConsistencyCheckRequestValidationSchema,
				params: glossaryRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.find(
					options as APIHandlerOptions<{
						params: GlossaryTermRouteParametersDto;
					}>,
				),
			method: "GET",
			path: GlossaryApiPath.TERM_$ID,
			validation: {
				params: glossaryTermRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.update(
					options as APIHandlerOptions<{
						body: GlossaryTermRequestDto;
						params: GlossaryTermRouteParametersDto;
					}>,
				),
			method: "PATCH",
			path: GlossaryApiPath.TERM_$ID,
			validation: {
				body: glossaryTermRequestValidationSchema,
				params: glossaryTermRouteParametersValidationSchema,
			},
		});

		this.addRoute({
			handler: (options) =>
				this.delete(
					options as APIHandlerOptions<{
						params: GlossaryTermRouteParametersDto;
					}>,
				),
			method: "DELETE",
			path: GlossaryApiPath.TERM_$ID,
			validation: {
				params: glossaryTermRouteParametersValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary/check-consistency:
	 *    post:
	 *      description: Check a piece of content against the project glossary and suggest canonical replacements for non-canonical term usage
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
	 *              $ref: "#/components/schemas/GlossaryConsistencyCheckRequest"
	 *      responses:
	 *        200:
	 *          description: Consistency matches
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/GlossaryConsistencyCheckResponse"
	 *        403:
	 *          description: Forbidden (non-member)
	 *        422:
	 *          description: Validation error
	 */
	private async checkConsistency(
		options: APIHandlerOptions<{
			body: GlossaryConsistencyCheckRequestDto;
			params: GlossaryRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.glossaryService.checkConsistency({
				content: options.body.content,
				context: this.getAuthenticatedSessionContext(options),
				projectId: Number(options.params.projectId),
			}),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary:
	 *    post:
	 *      description: Add a term to the project glossary (project Admin or Editor)
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
	 *              $ref: "#/components/schemas/GlossaryTermRequest"
	 *      responses:
	 *        201:
	 *          description: Term created
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/GlossaryTermResponse"
	 *        403:
	 *          description: Forbidden (Viewer role or non-member)
	 *        409:
	 *          description: A term with this name already exists in this project
	 *        422:
	 *          description: Validation error or invalid related terms
	 */
	private async create(
		options: APIHandlerOptions<{
			body: GlossaryTermRequestDto;
			params: GlossaryRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.glossaryService.create({
				context: this.getAuthenticatedSessionContext(options),
				payload: options.body,
				projectId: Number(options.params.projectId),
			}),
			status: HTTPCode.CREATED,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary/{id}:
	 *    delete:
	 *      description: Delete a glossary term and its related-term links (project Admin or Editor)
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
	 *        204:
	 *          description: Term deleted
	 *        403:
	 *          description: Forbidden (Viewer role or non-member)
	 *        404:
	 *          description: Term not found
	 */
	private async delete(
		options: APIHandlerOptions<{
			params: GlossaryTermRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		await this.glossaryService.delete({
			context: this.getAuthenticatedSessionContext(options),
			id: Number(options.params.id),
			projectId: Number(options.params.projectId),
		});

		return {
			payload: null,
			status: HTTPCode.NO_CONTENT,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary/{id}:
	 *    get:
	 *      description: Get a glossary term with its related terms
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
	 *          description: Glossary term
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/GlossaryTermResponse"
	 *        403:
	 *          description: Forbidden (non-member)
	 *        404:
	 *          description: Term not found
	 */
	private async find(
		options: APIHandlerOptions<{
			params: GlossaryTermRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.glossaryService.find({
				context: this.getAuthenticatedSessionContext(options),
				id: Number(options.params.id),
				projectId: Number(options.params.projectId),
			}),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary:
	 *    get:
	 *      description: List the project glossary A→Z, optionally filtered by term name
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: integer
	 *        - in: query
	 *          name: q
	 *          required: false
	 *          schema:
	 *            type: string
	 *            maxLength: 100
	 *      responses:
	 *        200:
	 *          description: Glossary terms
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/GlossaryTermsResponse"
	 *        403:
	 *          description: Forbidden (non-member)
	 */
	private async findAll(
		options: APIHandlerOptions<{
			params: GlossaryRouteParametersDto;
			query: GlossarySearchQueryDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.glossaryService.findAll({
				context: this.getAuthenticatedSessionContext(options),
				projectId: Number(options.params.projectId),
				query: options.query.q,
			}),
			status: HTTPCode.OK,
		};
	}

	/**
	 * @swagger
	 * /projects/{projectId}/glossary/{id}:
	 *    patch:
	 *      description: Update a glossary term's name, definition and related terms (project Admin or Editor)
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
	 *              $ref: "#/components/schemas/GlossaryTermRequest"
	 *      responses:
	 *        200:
	 *          description: Term updated
	 *          content:
	 *            application/json:
	 *              schema:
	 *                $ref: "#/components/schemas/GlossaryTermResponse"
	 *        403:
	 *          description: Forbidden (Viewer role or non-member)
	 *        404:
	 *          description: Term not found
	 *        409:
	 *          description: A term with this name already exists in this project
	 *        422:
	 *          description: Validation error or invalid related terms
	 */
	private async update(
		options: APIHandlerOptions<{
			body: GlossaryTermRequestDto;
			params: GlossaryTermRouteParametersDto;
		}>,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.glossaryService.update({
				context: this.getAuthenticatedSessionContext(options),
				id: Number(options.params.id),
				payload: options.body,
				projectId: Number(options.params.projectId),
			}),
			status: HTTPCode.OK,
		};
	}
}

export { GlossaryController };
