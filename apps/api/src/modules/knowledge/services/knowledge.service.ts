import {
	HTTPCode,
	KnowledgeValidationMessage,
} from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeTreeResponseDto,
} from "@knowledgeprism/types";

import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { type KnowledgeNodeRepository } from "../repositories/knowledge-node.repository.js";

class KnowledgeService {
	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private logger: Logger;

	private projectService: ProjectService;

	public constructor({
		knowledgeNodeRepository,
		logger,
		projectService,
	}: {
		knowledgeNodeRepository: KnowledgeNodeRepository;
		logger: Logger;
		projectService: ProjectService;
	}) {
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.logger = logger;
		this.projectService = projectService;
	}

	public async findEntry({
		context,
		entryId,
		projectId,
	}: {
		context: ProjectAccessContext;
		entryId: number;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const entry = await this.knowledgeNodeRepository.findByIdAndProjectId(
			entryId,
			projectId,
		);

		if (!entry) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return entry.toObject();
	}

	public async findTree({
		context,
		projectId,
	}: {
		context: ProjectAccessContext;
		projectId: number;
	}): Promise<KnowledgeTreeResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const nodes = await this.knowledgeNodeRepository.findAllByProjectId(
			projectId,
		);

		return {
			items: nodes.map((node) => node.toTreeItem()),
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
		await this.projectService.assertProjectEditAccess(projectId, context);

		const existingEntry =
			await this.knowledgeNodeRepository.findByIdAndProjectId(
				entryId,
				projectId,
			);

		if (!existingEntry) {
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

		this.logger.info(
			`User ${String(context.userId)} updated knowledge entry ${String(entryId)}`,
		);

		return updatedKnowledgeNode.toObject();
	}
}

export { KnowledgeService };
