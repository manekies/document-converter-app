import { registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";
import { Worker, isMainThread } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

import { batchProcess as batchProcessImpl0 } from "../../../../../document/batch_process";
import { batchProcessStream as batchProcessStreamImpl1 } from "../../../../../document/batch_stream";
import { compare as compareImpl2 } from "../../../../../document/compare";
import { convert as convertImpl3 } from "../../../../../document/convert";
import { get as getImpl4 } from "../../../../../document/get";
import { list as listImpl5 } from "../../../../../document/list";
import { listOutputs as listOutputsImpl6 } from "../../../../../document/list_outputs";
import { getDashboard as getDashboardImpl7 } from "../../../../../document/metrics";
import { spellcheck as spellcheckImpl8 } from "../../../../../document/nlp/spellcheck";
import { translate as translateImpl9 } from "../../../../../document/nlp/translate";
import { previewHtml as previewHtmlImpl10 } from "../../../../../document/preview";
import { process as processImpl11 } from "../../../../../document/process";
import { listTemplates as listTemplatesImpl12 } from "../../../../../document/templates";
import { upsertTemplate as upsertTemplateImpl13 } from "../../../../../document/templates";
import { createTemplate as createTemplateImpl14 } from "../../../../../document/templates_create";
import { deleteTemplate as deleteTemplateImpl15 } from "../../../../../document/templates_delete";
import { getTemplate as getTemplateImpl16 } from "../../../../../document/templates_get";
import { listMatchingTemplates as listMatchingTemplatesImpl17 } from "../../../../../document/templates_list";
import { updateTemplate as updateTemplateImpl18 } from "../../../../../document/templates_update";
import { updateDocument as updateDocumentImpl19 } from "../../../../../document/update";
import { upload as uploadImpl20 } from "../../../../../document/upload";
import { getVersion as getVersionImpl21 } from "../../../../../document/versions_get";
import { listVersions as listVersionsImpl22 } from "../../../../../document/versions_list";
import * as document_service from "../../../../../document/encore.service";

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "document",
            name:              "batchProcess",
            handler:           batchProcessImpl0,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "batchProcessStream",
            handler:           batchProcessStreamImpl1,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: true,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "compare",
            handler:           compareImpl2,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "convert",
            handler:           convertImpl3,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "get",
            handler:           getImpl4,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "list",
            handler:           listImpl5,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "listOutputs",
            handler:           listOutputsImpl6,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "getDashboard",
            handler:           getDashboardImpl7,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "spellcheck",
            handler:           spellcheckImpl8,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "translate",
            handler:           translateImpl9,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "previewHtml",
            handler:           previewHtmlImpl10,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "process",
            handler:           processImpl11,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "listTemplates",
            handler:           listTemplatesImpl12,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "upsertTemplate",
            handler:           upsertTemplateImpl13,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "createTemplate",
            handler:           createTemplateImpl14,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "deleteTemplate",
            handler:           deleteTemplateImpl15,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "getTemplate",
            handler:           getTemplateImpl16,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "listMatchingTemplates",
            handler:           listMatchingTemplatesImpl17,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "updateTemplate",
            handler:           updateTemplateImpl18,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "updateDocument",
            handler:           updateDocumentImpl19,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "upload",
            handler:           uploadImpl20,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "getVersion",
            handler:           getVersionImpl21,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
    {
        apiRoute: {
            service:           "document",
            name:              "listVersions",
            handler:           listVersionsImpl22,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
];

registerHandlers(handlers);

await run(import.meta.url);
