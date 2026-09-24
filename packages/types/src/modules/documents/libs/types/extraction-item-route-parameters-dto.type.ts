import { type DocumentRouteParametersDto } from "./document-route-parameters-dto.type.js";

type ExtractionItemRouteParametersDto = DocumentRouteParametersDto & {
	id: string;
};

export { type ExtractionItemRouteParametersDto };
