import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as document_service from "../../../../document/encore.service";

export async function batchProcess(params, opts) {
    const handler = (await import("../../../../document/batch_process")).batchProcess;
    registerTestHandler({
        apiRoute: { service: "document", name: "batchProcess", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "batchProcess", params, opts);
}

export async function batchProcessStream(params, opts) {
    const handler = (await import("../../../../document/batch_stream")).batchProcessStream;
    registerTestHandler({
        apiRoute: { service: "document", name: "batchProcessStream", raw: false, handler, streamingRequest: false, streamingResponse: true },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
    });

    return streamOut("document", "batchProcessStream", params, opts);
}

export async function compare(params, opts) {
    const handler = (await import("../../../../document/compare")).compare;
    registerTestHandler({
        apiRoute: { service: "document", name: "compare", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "compare", params, opts);
}

export async function convert(params, opts) {
    const handler = (await import("../../../../document/convert")).convert;
    registerTestHandler({
        apiRoute: { service: "document", name: "convert", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "convert", params, opts);
}

export async function get(params, opts) {
    const handler = (await import("../../../../document/get")).get;
    registerTestHandler({
        apiRoute: { service: "document", name: "get", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "get", params, opts);
}

export async function list(params, opts) {
    const handler = (await import("../../../../document/list")).list;
    registerTestHandler({
        apiRoute: { service: "document", name: "list", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "list", params, opts);
}

export async function listOutputs(params, opts) {
    const handler = (await import("../../../../document/list_outputs")).listOutputs;
    registerTestHandler({
        apiRoute: { service: "document", name: "listOutputs", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "listOutputs", params, opts);
}

export async function getDashboard(params, opts) {
    const handler = (await import("../../../../document/metrics")).getDashboard;
    registerTestHandler({
        apiRoute: { service: "document", name: "getDashboard", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "getDashboard", params, opts);
}

export async function spellcheck(params, opts) {
    const handler = (await import("../../../../document/nlp/spellcheck")).spellcheck;
    registerTestHandler({
        apiRoute: { service: "document", name: "spellcheck", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "spellcheck", params, opts);
}

export async function translate(params, opts) {
    const handler = (await import("../../../../document/nlp/translate")).translate;
    registerTestHandler({
        apiRoute: { service: "document", name: "translate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "translate", params, opts);
}

export async function previewHtml(params, opts) {
    const handler = (await import("../../../../document/preview")).previewHtml;
    registerTestHandler({
        apiRoute: { service: "document", name: "previewHtml", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "previewHtml", params, opts);
}

export async function process(params, opts) {
    const handler = (await import("../../../../document/process")).process;
    registerTestHandler({
        apiRoute: { service: "document", name: "process", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "process", params, opts);
}

export async function listTemplates(params, opts) {
    const handler = (await import("../../../../document/templates")).listTemplates;
    registerTestHandler({
        apiRoute: { service: "document", name: "listTemplates", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "listTemplates", params, opts);
}

export async function upsertTemplate(params, opts) {
    const handler = (await import("../../../../document/templates")).upsertTemplate;
    registerTestHandler({
        apiRoute: { service: "document", name: "upsertTemplate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "upsertTemplate", params, opts);
}

export async function createTemplate(params, opts) {
    const handler = (await import("../../../../document/templates_create")).createTemplate;
    registerTestHandler({
        apiRoute: { service: "document", name: "createTemplate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "createTemplate", params, opts);
}

export async function deleteTemplate(params, opts) {
    const handler = (await import("../../../../document/templates_delete")).deleteTemplate;
    registerTestHandler({
        apiRoute: { service: "document", name: "deleteTemplate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "deleteTemplate", params, opts);
}

export async function getTemplate(params, opts) {
    const handler = (await import("../../../../document/templates_get")).getTemplate;
    registerTestHandler({
        apiRoute: { service: "document", name: "getTemplate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "getTemplate", params, opts);
}

export async function listMatchingTemplates(params, opts) {
    const handler = (await import("../../../../document/templates_list")).listMatchingTemplates;
    registerTestHandler({
        apiRoute: { service: "document", name: "listMatchingTemplates", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "listMatchingTemplates", params, opts);
}

export async function updateTemplate(params, opts) {
    const handler = (await import("../../../../document/templates_update")).updateTemplate;
    registerTestHandler({
        apiRoute: { service: "document", name: "updateTemplate", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "updateTemplate", params, opts);
}

export async function updateDocument(params, opts) {
    const handler = (await import("../../../../document/update")).updateDocument;
    registerTestHandler({
        apiRoute: { service: "document", name: "updateDocument", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "updateDocument", params, opts);
}

export async function upload(params, opts) {
    const handler = (await import("../../../../document/upload")).upload;
    registerTestHandler({
        apiRoute: { service: "document", name: "upload", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "upload", params, opts);
}

export async function getVersion(params, opts) {
    const handler = (await import("../../../../document/versions_get")).getVersion;
    registerTestHandler({
        apiRoute: { service: "document", name: "getVersion", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "getVersion", params, opts);
}

export async function listVersions(params, opts) {
    const handler = (await import("../../../../document/versions_list")).listVersions;
    registerTestHandler({
        apiRoute: { service: "document", name: "listVersions", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: document_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("document", "listVersions", params, opts);
}
