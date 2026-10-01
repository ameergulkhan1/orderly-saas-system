import { apiFetch } from "./client";

export interface AIChatResponse {
  message: string;
  intent: string;
  toolUsed: string;
  data?: unknown;
}

export const aiAPI = {
  chat: (message: string) =>
    apiFetch<AIChatResponse>("/ai/chat", {
      method: "POST",
      json: { message },
    }),
};