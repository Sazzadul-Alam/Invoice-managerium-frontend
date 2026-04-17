import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { VerifyEmailToken } from "./pages/VerifyEmailToken";
import { Dashboard } from "./pages/Dashboard";
import { ShopSetup } from "./pages/ShopSetup";
import { AdminDashboard } from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/shop-setup",
    Component: ShopSetup,
  },
  {
    path: "/verify-email",
    Component: VerifyEmail,
  },
  {
    // This matches the URL sent in the verification email
    path: "/user/verify/:token",
    Component: VerifyEmailToken,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboard,
  },
]);
