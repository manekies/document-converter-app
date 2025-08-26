import { registerGateways, registerHandlers, run, type Handler } from "encore.dev/internal/codegen/appinit";

import { batchProcess as document_batchProcessImpl0 } from "../../../../document/batch_process";
import { batchProcessStream as document_batchProcessStreamImpl1 } from "../../../../document/batch_stream";
import { compare as document_compareImpl2 } from "../../../../document/compare";
import { convert as document_convertImpl3 } from "../../../../document/convert";
import { get as document_getImpl4 } from "../../../../document/get";
import { list as document_listImpl5 } from "../../../../document/list";
import { listOutputs as document_listOutputsImpl6 } from "../../../../document/list_outputs";
import { getDashboard as document_getDashboardImpl7 } from "../../../../document/metrics";
import { spellcheck as document_spellcheckImpl8 } from "../../../../document/nlp/spellcheck";
import { translate as document_translateImpl9 } from "../../../../document/nlp/translate";
import { previewHtml as document_previewHtmlImpl10 } from "../../../../document/preview";
import { process as document_processImpl11 } from "../../../../document/process";
import { listTemplates as document_listTemplatesImpl12 } from "../../../../document/templates";
import { upsertTemplate as document_upsertTemplateImpl13 } from "../../../../document/templates";
import { createTemplate as document_createTemplateImpl14 } from "../../../../document/templates_create";
import { deleteTemplate as document_deleteTemplateImpl15 } from "../../../../document/templates_delete";
import { getTemplate as document_getTemplateImpl16 } from "../../../../document/templates_get";
import { listMatchingTemplates as document_listMatchingTemplatesImpl17 } from "../../../../document/templates_list";
import { updateTemplate as document_updateTemplateImpl18 } from "../../../../document/templates_update";
import { updateDocument as document_updateDocumentImpl19 } from "../../../../document/update";
import { upload as document_uploadImpl20 } from "../../../../document/upload";
import { getVersion as document_getVersionImpl21 } from "../../../../document/versions_get";
import { listVersions as document_listVersionsImpl22 } from "../../../../document/versions_list";
import * as document_service from "../../../../document/encore.service";
import * as frontend_service from "../../../../frontend/encore.service";

const gateways: any[] = [
];

const handlers: Handler[] = [
    {
        apiRoute: {
            service:           "document",
            name:              "batchProcess",
            handler:           document_batchProcessImpl0,
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
            handler:           document_batchProcessStreamImpl1,
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
            handler:           document_compareImpl2,
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
            handler:           document_convertImpl3,
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
            handler:           document_getImpl4,
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
            handler:           document_listImpl5,
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
            handler:           document_listOutputsImpl6,
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
            handler:           document_getDashboardImpl7,
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
            handler:           document_spellcheckImpl8,
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
            handler:           document_translateImpl9,
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
            handler:           document_previewHtmlImpl10,
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
            handler:           document_processImpl11,
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
            handler:           document_listTemplatesImpl12,
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
            handler:           document_upsertTemplateImpl13,
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
            handler:           document_createTemplateImpl14,
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
            handler:           document_deleteTemplateImpl15,
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
            handler:           document_getTemplateImpl16,
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
            handler:           document_listMatchingTemplatesImpl17,
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
            handler:           document_updateTemplateImpl18,
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
            handler:           document_updateDocumentImpl19,
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
            handler:           document_uploadImpl20,
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
            handler:           document_getVersionImpl21,
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
            handler:           document_listVersionsImpl22,
            raw:               false,
            streamingRequest:  false,
            streamingResponse: false,
        },
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
        middlewares: document_service.default.cfg.middlewares || [],
    },
];

registerGateways(gateways);
registerHandlers(handlers);

await run(import.meta.url);
