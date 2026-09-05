import { type FastifySessionObject } from "@fastify/session";

type CustomSession = FastifySessionObject & {
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
