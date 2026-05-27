import { AuthProvider } from "react-admin";
import { signOut, getSession } from "next-auth/react";

export const authProvider: AuthProvider = {
  login: async () => {},
  logout: async () => {
    await signOut({ redirectTo: "/login" });
  },
  checkError: async () => {},
  checkAuth: async () => {},
  getPermissions: async () => {},
  getIdentity: async () => {
    const session = await getSession();
    if (!session) return { id: "", fullName: "" };
    return {
      id: session.user.id,
      fullName: session.user.email,
    };
  },
};
