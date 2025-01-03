/** --------------------------------------------------------------------------
 *  Inbound messages
 * ---------------------------------------------------------------------------*/

import { BaseMessage } from "@langchain/core/messages";

export interface WorkerInMessageUser {
    type: "CHAT";
    payload: {
      messages: BaseMessage[];
    };
  }
  
  export interface WorkerInMessageIngest {
    type: "INGEST";
    payload: {
      data: Blob;
    };
  }
  
  
  export type WorkerInMessage =
    | WorkerInMessageUser
    | WorkerInMessageIngest;
  
  /** --------------------------------------------------------------------------
   *  Outbound messages
   * ---------------------------------------------------------------------------*/
  
  export interface WorkerOutMessageToken {
    type: "TOKEN";
    payload: {
      token: string;
    };
  }
  
  
  export interface WorkerOutMessageLog {
    type: "LOG";
    payload: {
      log: string;
    };
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

  export interface WorkerOutMessageNewChat {
    type: "NEW_CHAT";
    payload: {
        id: string;
    };
  }
  
  export type WorkerOutMessage =
    | WorkerOutMessageToken
    | WorkerOutMessageLog | WorkerOutMessageError | WorkerOutMessageIngestDone | WorkerOutMessageNewChat;