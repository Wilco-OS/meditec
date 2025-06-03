import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Erweitern des User-Objekts um zusätzliche Felder
   */
  interface User {
    id: string;
    role: string;
    companyId?: string;
  }

  /**
   * Erweitern des Session-Objekts um zusätzliche Felder
   */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      companyId?: string;
    }
  }
}

declare module "next-auth/jwt" {
  /**
   * Erweitern des JWT-Objekts um zusätzliche Felder
   */
  interface JWT {
    id: string;
    role: string;
    companyId?: string;
  }
}
