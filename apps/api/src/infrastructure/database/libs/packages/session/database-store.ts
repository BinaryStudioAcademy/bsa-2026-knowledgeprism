import { type SessionStore } from "@fastify/session";
import { TimeMs } from "@knowledgeprism/constants";
import { type Knex } from "knex";

import { DatabaseTableName } from "~/infrastructure/database/libs/enums/enums.js";
import {
	type CustomSession,
	type SessionRow,
} from "~/infrastructure/database/libs/types/session.type.js";

type SessionStoreCallback = (error?: Error) => void;

type SessionStoreGetCallback = (
	error: Error | null,
	session?: CustomSession | null,
) => void;

type SessionWriteRow = {
	data: string;
	expires_at: string;
	id: string;
	updated_at?: string;
	user_id: null | number;
};

const isCustomSession = (value: unknown): value is CustomSession => {
	return typeof value === "object" && value !== null && "cookie" in value;
};

const parseSessionData = (data: SessionRow["data"]): CustomSession => {
	const parsed: unknown = typeof data === "string" ? JSON.parse(data) : data;

	if (!isCustomSession(parsed)) {
		throw new Error("Invalid session data");
	}

	return parsed;
};

const toError = (error: unknown): Error => {
	return error instanceof Error ? error : new Error(String(error));
};

class DatabaseStore implements SessionStore {
	private database: Knex;

	public constructor(database: Knex) {
		this.database = database;
	}

	public destroy(sessionId: string, callback: SessionStoreCallback): void {
		void this.database<SessionRow>(DatabaseTableName.SESSIONS)
			.where({ id: sessionId })
			.del()
			.then(() => {
				callback();
			})
			.catch((error: unknown) => {
				callback(toError(error));
			});
	}

	public get(sessionId: string, callback: SessionStoreGetCallback): void {
		void this.database<SessionRow>(DatabaseTableName.SESSIONS)
			.where({ id: sessionId })
			.andWhere("expires_at", ">", new Date())
			.first()
			.then((row) => {
				if (!row) {
					callback(null, null);

					return;
				}
				try {
					callback(null, parseSessionData(row.data));
				} catch (error) {
					callback(toError(error));
				}
			})
			.catch((error: unknown) => {
				callback(toError(error));
			});
	}

	public set(
		sessionId: string,
		session: CustomSession,
		callback: SessionStoreCallback,
	): void {
		console.log("SESSION IN SET:", session);
		console.log("USER ID IN SET:", session.userId);
		console.log("SESSION JSON:", JSON.stringify(session));
		const expiresAt = session.cookie.expires
			? new Date(session.cookie.expires)
			: new Date(Date.now() + TimeMs.DAY);
		const userId = session.userId ?? null;
		const sessionRow: SessionWriteRow = {
			data: JSON.stringify(session),
			expires_at: expiresAt.toISOString(),
			id: sessionId,
			user_id: userId,
		};

		void this.database<SessionWriteRow>(DatabaseTableName.SESSIONS)
			.insert(sessionRow)
			.onConflict("id")
			.merge({
				...sessionRow,
				updated_at: new Date().toISOString(),
			})
			.then(() => {
				callback();
			})
			.catch((error: unknown) => {
				callback(toError(error));
			});
	}
}

export { DatabaseStore };
