/** --------------------------------------------------------------------------
 *  Inbound messages
 * ---------------------------------------------------------------------------*/

import { Document } from "@langchain/core/documents";
import { BaseMessage } from "@langchain/core/messages";

export interface WorkerInMessageUser {
  type: "CHAT";
  payload: {
    messages: BaseMessage[];
    systemPrompt: string;
  };
}

export interface WorkerInMessageIngest {
  type: "INGEST";
  payload: {
    data: Blob;
  };
}

export type WorkerInMessage = WorkerInMessageUser | WorkerInMessageIngest;

/** --------------------------------------------------------------------------
 *  Outbound messages
 * ---------------------------------------------------------------------------*/

export interface WorkerOutMessageToken {
  type: "TOKEN";
  payload: {
    token: string;
  };
}

export interface WorkerOutMessageDoc {
  type: "DOC";
  payload: {
    docs: Document[];
  };
}

export interface WorkerOutMessageQuery {
  type: "QUERY";
  payload: {
    query: string;
  };
}

export interface WorkerOutMessageLog {
  type: "LOG";
  payload: {
    log: string;
  };
}

export interface WorkerOutMessageDone {
  type: "DONE";
}

export interface WorkerOutMessageError {
  type: "ERROR";
  payload: {
    error: string;
  };
}

export interface WorkerOutMessageIngestDone {
  type: "INGEST_DONE";
}
export type WorkerOutMessage =
  | WorkerOutMessageToken
  | WorkerOutMessageLog
  | WorkerOutMessageError
  | WorkerOutMessageIngestDone
  | WorkerOutMessageDoc
  | WorkerOutMessageQuery
  | WorkerOutMessageDone;
