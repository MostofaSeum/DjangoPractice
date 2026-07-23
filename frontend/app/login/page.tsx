"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const { register, login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await register(formData);
    if (created) {
      // Auto login after registration
      await login(formData.username, formData.password);
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Input fields for username, email, password, etc. */}
      <button type="submit">Create Account</button>
    </form>
  );
}
