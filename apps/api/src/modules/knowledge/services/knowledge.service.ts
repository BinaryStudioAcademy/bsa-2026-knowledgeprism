import {
	HTTPCode,
	KnowledgeValidationMessage,
} from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeRecentResponseDto,
} from "@knowledgeprism/types";

import { HTTPError } from "~/infrastructure/http/http.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { type KnowledgeNodeRepository } from "../repositories/knowledge-node.repository.js";

class KnowledgeService {
	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private projectService: ProjectService;

	public constructor({
		knowledgeNodeRepository,
		projectService,
	}: {
		knowledgeNodeRepository: KnowledgeNodeRepository;
		projectService: ProjectService;
	}) {
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.projectService = projectService;
	}

	public async findRecent(
		context: ProjectAccessContext,
	): Promise<KnowledgeRecentResponseDto> {
		const projectIds =
			await this.projectService.findAccessibleProjectIds(context);
		const entries =
			await this.knowledgeNodeRepository.findRecentByProjectIds(projectIds);

		return {
			items: entries.map((entry) => ({
				id: entry.id,
				projectId: entry.projectId,
				title: entry.title,
				updatedAt: entry.updatedAt.toISOString(),
			})),
		};
	}

	public async updateEntry({
		context,
		entryId,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		entryId: number;
		payload: KnowledgeEntryUpdateRequestDto;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const existingEntry = await this.knowledgeNodeRepository.findById(entryId);

		if (!existingEntry || existingEntry.toObject().projectId !== projectId) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const updatedKnowledgeNode = await this.knowledgeNodeRepository.update({
			contentJson: payload.contentJson,
			id: entryId,
			title: payload.title,
			updatedBy: context.userId,
		});

		return updatedKnowledgeNode.toObject();
	}
}

export { KnowledgeService };
