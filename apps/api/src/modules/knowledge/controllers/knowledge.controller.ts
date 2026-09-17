import { APIPath, KnowledgeApiPath } from "@knowledgeprism/constants";
import {
	knowledgeSearchQueryValidationSchema,
	knowledgeSearchRouteParametersValidationSchema,
} from "@knowledgeprism/schemas";

import {
	APIHandlerResponse,
	BaseController,
} from "~/infrastructure/controller/controller.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { type KnowledgeService } from "../services/knowledge.service.js";

class KnowledgeController extends BaseController {
	private knowledgeService: KnowledgeService;

	public constructor(logger: Logger, knowledgeService: KnowledgeService) {
		super(logger, APIPath.PROJECTS);

		this.knowledgeService = knowledgeService;

		this.addRoute({
			handler: () => this.search(),
			method: "GET",
			path: KnowledgeApiPath.SEARCH,
			validation: {
				params: knowledgeSearchRouteParametersValidationSchema,
				query: knowledgeSearchQueryValidationSchema,
			},
		});
	}

	/**
	 * @swagger
	 * /projects/{projectId}/knowledge/search:
	 *    get:
	 *      description: Search project knowledge base
	 *      parameters:
	 *        - in: path
	 *          name: projectId
	 *          required: true
	 *          schema:
	 *            type: string
	 *        - in: query
	 *          name: q
	 *          required: true
	 *          schema:
	 *            type: string
	 *      responses:
	 *        200:
	 *          description: Knowledge search results
	 */
	// validates projectId and q, but returns empty results until search logic is connected
	private search(): APIHandlerResponse {
		return {
			payload: this.knowledgeService.search(),
			status: HTTPCode.OK,
		};
	}
}

export { KnowledgeController };
