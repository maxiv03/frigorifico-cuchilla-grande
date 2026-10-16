"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { IconBriefcase, IconUsers } from "@/components/icons";
import { Tabs } from "@/components/ui/tabs";
import type { ContactTab } from "@/lib/forms/contact-rules";
import type { CutOption } from "./cut-picker";
import { ProducerForm } from "./producer-form";
import { QuoteForm } from "./quote-form";

type Props = {
  initialTab: ContactTab;
  /** Cortes precargados desde ?cut=<id> (ids neutros, ya validados contra el catálogo). */
  initialCuts: string[];
  cuts: CutOption[];
  speciesLabels: Record<"beef" | "lamb", string>;
  /** Texto y link al portal (renderizados en el servidor). */
  quoteIntro: ReactNode;
  producerIntro: ReactNode;
};

/**
 * Pestañas de contacto. La pestaña vive en la URL (?tab=quote|producer): al cambiar se reemplaza
 * el parámetro con la History API (sin ida y vuelta al servidor), así el link es compartible.
 */
export function ContactTabs({ initialTab, initialCuts, cuts, speciesLabels, quoteIntro, producerIntro }: Props) {
  const t = useTranslations("Contact.tabs");
  const [tab, setTab] = useState<ContactTab>(initialTab);

  const change = (id: string) => {
    setTab(id as ContactTab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState(window.history.state, "", url);
  };

  return (
    <Tabs
      label={t("label")}
      idPrefix="contact"
      value={tab}
      onValueChange={change}
      focusablePanels={false}
      items={[
        {
          id: "quote",
          label: t("quote"),
          icon: <IconBriefcase width={18} height={18} />,
          panel: (
            <>
              {quoteIntro}
              <QuoteForm key={initialCuts.join(",")} cuts={cuts} initialCuts={initialCuts} speciesLabels={speciesLabels} />
            </>
          ),
        },
        {
          id: "producer",
          label: t("producer"),
          icon: <IconUsers width={18} height={18} />,
          panel: (
            <>
              {producerIntro}
              <ProducerForm />
            </>
          ),
        },
      ]}
    />
  );
}
