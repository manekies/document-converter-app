import { CallOpts } from "encore.dev/api";

import {
  StreamInOutHandlerFn,
  StreamInHandlerFn,
  StreamOutHandlerFn,
  StreamOutWithResponse,
  StreamIn,
  StreamInOut,
} from "encore.dev/api";

import { batchProcessStream as batchProcessStream_handler } from "../../../../document/batch_stream.js";

type StreamHandshake<Type extends (...args: any[]) => any> = Parameters<Type> extends [infer H, any] ? H : void;

type StreamRequest<Type> = Type extends
  | StreamInOutHandlerFn<any, infer Req, any>
  | StreamInHandlerFn<any, infer Req, any>
  | StreamOutHandlerFn<any, any>
  ? Req
  : never;

type StreamResponse<Type> = Type extends
  | StreamInOutHandlerFn<any, any, infer Resp>
  | StreamInHandlerFn<any, any, infer Resp>
  | StreamOutHandlerFn<any, infer Resp>
  ? Resp
  : never;

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { batchProcess as batchProcess_handler } from "../../../../document/batch_process.js";
declare const batchProcess: WithCallOpts<typeof batchProcess_handler>;
export { batchProcess };

export function batchProcessStream(
  ...args: StreamHandshake<typeof batchProcessStream_handler> extends void
    ? [opts?: CallOpts]
    : [data: StreamHandshake<typeof batchProcessStream_handler>, opts?: CallOpts]
): Promise<
  StreamIn<
    StreamResponse<typeof batchProcessStream_handler>
  >
>;
import { compare as compare_handler } from "../../../../document/compare.js";
declare const compare: WithCallOpts<typeof compare_handler>;
export { compare };

import { convert as convert_handler } from "../../../../document/convert.js";
declare const convert: WithCallOpts<typeof convert_handler>;
export { convert };

import { get as get_handler } from "../../../../document/get.js";
declare const get: WithCallOpts<typeof get_handler>;
export { get };

import { list as list_handler } from "../../../../document/list.js";
declare const list: WithCallOpts<typeof list_handler>;
export { list };

import { listOutputs as listOutputs_handler } from "../../../../document/list_outputs.js";
declare const listOutputs: WithCallOpts<typeof listOutputs_handler>;
export { listOutputs };

import { getDashboard as getDashboard_handler } from "../../../../document/metrics.js";
declare const getDashboard: WithCallOpts<typeof getDashboard_handler>;
export { getDashboard };

import { spellcheck as spellcheck_handler } from "../../../../document/nlp/spellcheck.js";
declare const spellcheck: WithCallOpts<typeof spellcheck_handler>;
export { spellcheck };

import { translate as translate_handler } from "../../../../document/nlp/translate.js";
declare const translate: WithCallOpts<typeof translate_handler>;
export { translate };

import { previewHtml as previewHtml_handler } from "../../../../document/preview.js";
declare const previewHtml: WithCallOpts<typeof previewHtml_handler>;
export { previewHtml };

import { process as process_handler } from "../../../../document/process.js";
declare const process: WithCallOpts<typeof process_handler>;
export { process };

import { listTemplates as listTemplates_handler } from "../../../../document/templates.js";
declare const listTemplates: WithCallOpts<typeof listTemplates_handler>;
export { listTemplates };

import { upsertTemplate as upsertTemplate_handler } from "../../../../document/templates.js";
declare const upsertTemplate: WithCallOpts<typeof upsertTemplate_handler>;
export { upsertTemplate };

import { createTemplate as createTemplate_handler } from "../../../../document/templates_create.js";
declare const createTemplate: WithCallOpts<typeof createTemplate_handler>;
export { createTemplate };

import { deleteTemplate as deleteTemplate_handler } from "../../../../document/templates_delete.js";
declare const deleteTemplate: WithCallOpts<typeof deleteTemplate_handler>;
export { deleteTemplate };

import { getTemplate as getTemplate_handler } from "../../../../document/templates_get.js";
declare const getTemplate: WithCallOpts<typeof getTemplate_handler>;
export { getTemplate };

import { listMatchingTemplates as listMatchingTemplates_handler } from "../../../../document/templates_list.js";
declare const listMatchingTemplates: WithCallOpts<typeof listMatchingTemplates_handler>;
export { listMatchingTemplates };

import { updateTemplate as updateTemplate_handler } from "../../../../document/templates_update.js";
declare const updateTemplate: WithCallOpts<typeof updateTemplate_handler>;
export { updateTemplate };

import { updateDocument as updateDocument_handler } from "../../../../document/update.js";
declare const updateDocument: WithCallOpts<typeof updateDocument_handler>;
export { updateDocument };

import { upload as upload_handler } from "../../../../document/upload.js";
declare const upload: WithCallOpts<typeof upload_handler>;
export { upload };

import { getVersion as getVersion_handler } from "../../../../document/versions_get.js";
declare const getVersion: WithCallOpts<typeof getVersion_handler>;
export { getVersion };

import { listVersions as listVersions_handler } from "../../../../document/versions_list.js";
declare const listVersions: WithCallOpts<typeof listVersions_handler>;
export { listVersions };
