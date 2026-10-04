import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "STAFF";
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "STAFF";
  }
}
