import React, { useCallback, useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, RefreshCw, Wifi, HardDrive, Code2, Loader2 } from "lucide-react";
import PageHeader, { SecurityNote } from "@/components/PageHeader";
import SecurityBadge from "@/components/SecurityBadge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

function checkEnvironment(t) {
  const secure = window.isSecureContext === true;
  const cryptoOk = !!window.crypto?.subtle && typeof window.crypto.getRandomValues === "function";
  const worker = typeof Worker !== "undefined";
  const storage = (() => { try { localStorage.setItem("__ec_test", "1"); localStorage.removeItem("__ec_test"); return true; } catch { return false; } })();
  const sw = "serviceWorker" in navigator;
  const online = navigator.onLine;
  const external = Array.from(document.querySelectorAll("script[src],link[href]"), (el) => el.src || el.href)
    .filter(Boolean)
    .filter((u) => { try { return new URL(u, location.href).origin !== location.origin; } catch { return false; } });

  return [
    ["secureContext", secure, secure ? t("security.secureContextOk") : t("security.secureContextBad")],
    ["webCrypto", cryptoOk, cryptoOk ? t("security.webCryptoOk") : t("security.webCryptoBad")],
    ["webWorkers", worker, worker ? t("security.workersOk") : t("security.workersBad")],
    ["localStorage", storage, storage ? t("security.storageOk") : t("security.storageBad")],
    ["serviceWorker", sw, sw ? t("security.serviceWorkerOk") : t("security.serviceWorkerBad")],
    ["network", online, online ? t("security.networkOk") : t("security.networkBad")],
    ["external", external.length === 0, external.length === 0 ? t("security.externalOk") : t("security.externalBad", { count: external.length })],
  ];
}

export default function SecurityCheck() {
  const { t } = useI18n();
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(() => {
    setRunning(true);
    // Yield once so the button visibly enters its running state before synchronous checks complete.
    window.setTimeout(() => {
      try { setChecks(checkEnvironment(t)); } finally { setRunning(false); }
    }, 0);
  }, [t]);

  useEffect(() => { runChecks(); }, [runChecks]);

  const passed = checks.filter(([, ok]) => ok).length;
  const failed = checks.length - passed;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
      <PageHeader icon={ShieldCheck} title={t("security.title")} subtitle={t("security.subtitle")}>
        <SecurityBadge level="secure" />
      </PageHeader>
      <SecurityNote variant="warn">{t("security.note")}</SecurityNote>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-medium">{t("security.summary")}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {checks.length ? `${passed} ${t("security.passed")}${failed ? ` · ${failed} ${t("security.failedChecks")}` : ""}` : t("security.checking")}
          </div>
        </div>
        <Button variant="outline" onClick={runChecks} disabled={running} className="gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? t("security.checking") : t("security.runAgain")}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {checks.map(([name, ok, desc]) => (
          <div key={name} className="flex gap-4 rounded-xl border border-border p-4">
            <div className={`mt-0.5 rounded-full p-2 ${ok ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
              {ok ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div className="min-w-0"><div className="font-medium">{t(`security.checkNames.${name}`)}</div><div className="mt-1 text-sm text-muted-foreground">{desc}</div></div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [Wifi, t("security.networkRequests"), t("security.networkDesc")],
          [HardDrive, t("security.storage"), t("security.storageDesc")],
          [Code2, t("security.implementation"), t("security.implementationDesc")],
        ].map(([Icon, title, description]) => (
          <div key={title} className="rounded-xl border border-border p-4"><Icon className="h-5 w-5 text-red-400" /><div className="mt-3 font-medium">{title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
        ))}
      </div>
    </div>
  );
}
