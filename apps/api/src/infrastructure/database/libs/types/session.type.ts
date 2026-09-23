import { type FastifySessionObject } from "@fastify/session";
import { type OrganisationRole } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

type CustomSession = FastifySessionObject & {
	organisationId?: number;
	organisationRole?: null | ValueOf<typeof OrganisationRole>;
	userId?: number;
};

type SessionRow = {
	created_at?: string;
	data: object | string;
	expires_at: Date | string;
	id: string;
	updated_at?: string;
	user_id: null | number;
};

export { type CustomSession, type SessionRow };
