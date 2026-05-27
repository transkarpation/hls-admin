import { AuthProvider } from "react-admin";
import { signOut } from "next-auth/react";

export const authProvider: AuthProvider = {
  login: async () => {},
  logout: async () => {
    await signOut({ redirectTo: "/login" });
  },
  checkError: async () => {},
  checkAuth: async () => {},
  getPermissions: async () => {},
};
