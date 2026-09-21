import { APIPath, HTTPCode, KnowledgeApiPath } from "@knowledgeprism/constants";

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
 *   schemas:
 *     RecentKnowledgeItem:
 *       type: object
 *       required: [id, projectId, title, updatedAt]
 *       properties:
 *         id: { type: integer, minimum: 1 }
 *         projectId: { type: integer, minimum: 1 }
 *         title: { type: string }
 *         updatedAt: { type: string, format: date-time }
 *     RecentKnowledgeResponse:
 *       type: object
 *       required: [items]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecentKnowledgeItem'
 * paths:
 *   /knowledge/recent:
 *     get:
 *       tags: [Knowledge]
 *       summary: List recently updated knowledge entries
 *       description: Returns all knowledge entries from projects accessible to the authenticated user, newest first.
 *       security:
 *         - sessionAuth: []
 *       responses:
 *         '200':
 *           description: Recent knowledge entries
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/RecentKnowledgeResponse'
 *         '401':
 *           description: Session is missing or unauthenticated
 *         '403':
 *           description: User is inactive or does not have access
 */
class RecentKnowledgeController extends BaseController {
	private knowledgeService: KnowledgeService;

	public constructor(logger: Logger, knowledgeService: KnowledgeService) {
		super(logger, APIPath.KNOWLEDGE);

		this.knowledgeService = knowledgeService;

		this.addRoute({
			handler: (options) => this.findRecent(options),
			method: "GET",
			path: KnowledgeApiPath.RECENT,
		});
	}

	private async findRecent(
		options: APIHandlerOptions,
	): Promise<APIHandlerResponse> {
		return {
			payload: await this.knowledgeService.findRecent(
				this.getAuthenticatedSessionContext(options),
			),
			status: HTTPCode.OK,
		};
	}
}

export { RecentKnowledgeController };
