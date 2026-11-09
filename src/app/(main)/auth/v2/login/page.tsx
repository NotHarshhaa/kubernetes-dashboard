import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Authenticate with your operator credentials to access the Kubernetes dashboard.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
