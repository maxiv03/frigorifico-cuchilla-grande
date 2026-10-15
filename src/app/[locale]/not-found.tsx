import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-24">
      <h1 className="text-3xl font-semibold text-stone-900">{t("title")}</h1>
      <p className="text-stone-600">{t("text")}</p>
      <Link href="/" className="font-medium text-[#7a1f2b] underline underline-offset-4">
        {t("back")}
      </Link>
    </main>
  );
}
