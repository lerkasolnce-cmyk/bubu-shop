import { getLocale, getT } from "@/lib/i18n";
import { isDemoMode } from "@/lib/demo";
import LoginForm from "@/components/admin/LoginForm";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const t = getT(locale);

  return (
    <div className="flex flex-1 items-center justify-center bg-white px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-extrabold text-ink">
          {t("admin.login.title")}
        </h1>
        {isDemoMode() ? (
          <p className="rounded-md border border-ink/10 bg-mint/30 px-4 py-3 text-sm text-ink/80">
            {t("admin.login.demoNotice")}
          </p>
        ) : (
          <LoginForm
            labels={{
              email: t("admin.login.email"),
              password: t("admin.login.password"),
              submit: t("admin.login.submit"),
              submitting: t("admin.login.submitting"),
              error: t("admin.login.error"),
            }}
          />
        )}
      </div>
    </div>
  );
}
