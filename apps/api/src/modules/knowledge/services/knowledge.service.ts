import {
	HTTPCode,
	KnowledgeValidationMessage,
	ProjectMemberRole,
} from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeSearchResponseDto,
} from "@knowledgeprism/types";

import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { ProjectMemberModel } from "~/modules/projects/models/project-member.model.js";

import { type KnowledgeNodeRepository } from "../repositories/knowledge-node.repository.js";

class KnowledgeService {
	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private logger: Logger;

	public constructor({
		knowledgeNodeRepository,
		logger,
	}: {
		knowledgeNodeRepository: KnowledgeNodeRepository;
		logger: Logger;
	}) {
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.logger = logger;
	}

	public async search({
		projectId,
		query,
		userId,
	}: {
		projectId: number;
		query: string;
		userId: number;
	}): Promise<KnowledgeSearchResponseDto> {
		const member = await ProjectMemberModel.query()
			.findOne({ projectId, userId })
			.execute();

		if (!member) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}

		const nodes = await this.knowledgeNodeRepository.searchByTitleOrKeyword({
			projectId,
			query,
		});

		return {
			items: nodes.map((node) => {
				const { contentJson, id, title } = node.toObject();

				return { content: contentJson, id, title };
			}),
		};
	}

	public async updateEntry({
		entryId,
		payload,
		projectId,
		userId,
	}: {
		entryId: number;
		payload: KnowledgeEntryUpdateRequestDto;
		projectId: number;
		userId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		const member = await ProjectMemberModel.query()
			.findOne({ projectId, userId })
			.execute();

		if (!member) {
			this.logger.warn(
				`User ${String(userId)} is not a member of project ${String(projectId)}`,
			);
			throw new HTTPError({
				message: KnowledgeValidationMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}

		if (member.role === ProjectMemberRole.VIEWER) {
			this.logger.warn(
				`User ${String(userId)} with role VIEWER attempted to edit entry ${String(entryId)}`,
			);
			throw new HTTPError({
				message: KnowledgeValidationMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}

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
			updatedBy: userId,
		});

		return updatedKnowledgeNode.toObject();
	}
}

export { KnowledgeService };
