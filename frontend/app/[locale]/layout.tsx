import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { LanguageProvider } from "@/store/LanguageContext";
import React from "react";

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <LanguageProvider>{children}</LanguageProvider>
    </NextIntlClientProvider>
  );
}
