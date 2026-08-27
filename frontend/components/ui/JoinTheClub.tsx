"use client";

import { useState, FormEvent } from "react";
import Swal from "sweetalert2";
import { getApiBaseUrl } from "@/config/siteConfig";
import { useLanguage } from "@/store/LanguageContext";

export default function JoinTheClub() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      Swal.fire({
        icon: "warning",
        title: "Email Required",
        text: "Please enter a valid email address.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    try {
      setLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/store/subscribers/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        // Successfully added
        setEmail(""); // Remove the email from the form
        Swal.fire({
          icon: "success",
          title: "Subscribed!",
          text: data.message || "The mail is added. We will reach you soon.",
          confirmButtonColor: "#10b981",
        });
      } else {
        // Handle duplicate or validation errors
        if (data.is_duplicate || (data.error && data.error.includes("already have you"))) {
          Swal.fire({
            icon: "info",
            title: "Already Subscribed",
            text: "We already have you!",
            confirmButtonColor: "#3b82f6",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Subscription Error",
            text: data.error || "Unable to join the club at this time.",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (err) {
      console.error("Failed to subscribe:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Something went wrong. Please try again later.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-secondary text-foreground border border-foreground/10 py-20 px-8 md:px-12 mx-4 md:mx-12 lg:mx-20 rounded-[3rem] shadow-xl flex flex-col items-center text-center relative overflow-hidden group transition-colors duration-300">
      <div className="absolute top-0 right-0 p-12 opacity-5 transform group-hover:rotate-12 transition-transform duration-700 pointer-events-none group-hover:scale-110">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M11 3 8 9l4 13" />
          <path d="M12 22 16 9l-3-6" />
        </svg>
      </div>
      <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 relative z-10">
        {t("newsletter.title")}
      </h2>
      <p className="text-sm md:text-base opacity-70 font-medium mb-10 max-w-md relative z-10">
        {t("newsletter.subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md relative z-10">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletter.placeholder")}
          required
          className="flex-1 bg-secondary border border-foreground/15 rounded-2xl px-6 py-4 text-xs font-bold text-foreground placeholder:text-foreground/50 outline-none focus:ring-2 focus:ring-accent transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-button-bg text-button-fg px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center shadow-md hover:shadow-lg hover:-translate-y-0.5 duration-300 disabled:opacity-50 cursor-pointer"
        >
          {loading ? t("newsletter.subscribing") : t("newsletter.subscribe")}
        </button>
      </form>
    </section>
  );
}
