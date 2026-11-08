import type { Metadata } from "next";

import { RegisterForm } from "../_components/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Register an operator account for the Kubernetes dashboard.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
