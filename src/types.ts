export type InteractionMode = "reflection" | "summary" | "brainstorm" | "chat";

export interface ChatTurn {
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface UserInteraction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  aiResponse: string;
  mode: InteractionMode;
  tags: string[];
  turns?: ChatTurn[];
  modelUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
