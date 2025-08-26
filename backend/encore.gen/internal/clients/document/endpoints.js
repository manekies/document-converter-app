import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";

const TEST_ENDPOINTS = typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test"
    ? await import("./endpoints_testing.js")
    : null;

export async function batchProcess(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.batchProcess(params, opts);
    }

    return apiCall("document", "batchProcess", params, opts);
}
export async function batchProcessStream(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.batchProcessStream(params, opts);
    }

    return streamOut("document", "batchProcessStream", params, opts);
}
export async function compare(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.compare(params, opts);
    }

    return apiCall("document", "compare", params, opts);
}
export async function convert(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.convert(params, opts);
    }

    return apiCall("document", "convert", params, opts);
}
export async function get(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.get(params, opts);
    }

    return apiCall("document", "get", params, opts);
}
export async function list(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.list(params, opts);
    }

    return apiCall("document", "list", params, opts);
}
export async function listOutputs(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listOutputs(params, opts);
    }

    return apiCall("document", "listOutputs", params, opts);
}
export async function getDashboard(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getDashboard(params, opts);
    }

    return apiCall("document", "getDashboard", params, opts);
}
export async function spellcheck(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.spellcheck(params, opts);
    }

    return apiCall("document", "spellcheck", params, opts);
}
export async function translate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.translate(params, opts);
    }

    return apiCall("document", "translate", params, opts);
}
export async function previewHtml(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.previewHtml(params, opts);
    }

    return apiCall("document", "previewHtml", params, opts);
}
export async function process(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.process(params, opts);
    }

    return apiCall("document", "process", params, opts);
}
export async function listTemplates(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listTemplates(params, opts);
    }

    return apiCall("document", "listTemplates", params, opts);
}
export async function upsertTemplate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.upsertTemplate(params, opts);
    }

    return apiCall("document", "upsertTemplate", params, opts);
}
export async function createTemplate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.createTemplate(params, opts);
    }

    return apiCall("document", "createTemplate", params, opts);
}
export async function deleteTemplate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.deleteTemplate(params, opts);
    }

    return apiCall("document", "deleteTemplate", params, opts);
}
export async function getTemplate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getTemplate(params, opts);
    }

    return apiCall("document", "getTemplate", params, opts);
}
export async function listMatchingTemplates(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listMatchingTemplates(params, opts);
    }

    return apiCall("document", "listMatchingTemplates", params, opts);
}
export async function updateTemplate(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.updateTemplate(params, opts);
    }

    return apiCall("document", "updateTemplate", params, opts);
}
export async function updateDocument(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.updateDocument(params, opts);
    }

    return apiCall("document", "updateDocument", params, opts);
}
export async function upload(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.upload(params, opts);
    }

    return apiCall("document", "upload", params, opts);
}
export async function getVersion(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getVersion(params, opts);
    }

    return apiCall("document", "getVersion", params, opts);
}
export async function listVersions(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listVersions(params, opts);
    }

    return apiCall("document", "listVersions", params, opts);
}
