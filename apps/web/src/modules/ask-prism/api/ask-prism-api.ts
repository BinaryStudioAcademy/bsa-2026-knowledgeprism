import {
	type AskPrismRequestDto,
	type AskPrismResponseDto,
} from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

class AskPrismApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: "/ask-prism", storage });
	}

	public async ask(payload: AskPrismRequestDto): Promise<AskPrismResponseDto> {
		const response = await this.load(this.getFullEndpoint("/", {}), {
			contentType: ContentType.JSON,
			hasAuth: true,
			method: "POST",
			payload: JSON.stringify(payload),
		});

		return await response.json<AskPrismResponseDto>();
	}
}

export { AskPrismApi };
