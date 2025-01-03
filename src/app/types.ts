export enum ChatRole {
  USER = "user",
  AI = "ai",
}
export interface ChatMessage {
  role: ChatRole;
  content: string;
}
