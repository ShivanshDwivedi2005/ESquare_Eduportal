import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  userId?: string;
  institutionId?: string;
  membershipId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
