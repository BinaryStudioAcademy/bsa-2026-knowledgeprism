import { DocumentStatus } from "@knowledgeprism/constants";

const CANCELLABLE_DOCUMENT_STATUSES = [
	DocumentStatus.EXTRACTED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.FAILED,
	DocumentStatus.INTEGRATING,
	DocumentStatus.PARSED,
	DocumentStatus.PROCESSING,
	DocumentStatus.UPLOADED,
	DocumentStatus.VALIDATED,
	DocumentStatus.WAITING_FOR_APPROVAL,
	DocumentStatus.WAITING_FOR_VALIDATION,
];

export { CANCELLABLE_DOCUMENT_STATUSES };
