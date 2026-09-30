import { createContext, useContext } from "react";
import type { ReactNode } from "react";

// Lets an admin section put extra breadcrumb bits (a night's date, "2 unsaved")
// into the admin bar that pages/AdminPage.tsx draws.
export const AdminChrome = createContext<{ setCrumb: (n: ReactNode) => void }>({ setCrumb: () => {} });
export const useAdminChrome = () => useContext(AdminChrome);
