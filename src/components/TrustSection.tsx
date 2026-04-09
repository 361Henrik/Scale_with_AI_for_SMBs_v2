import { Shield, Lock, Eye, MapPin, FileCheck, Check, Clock, AlertTriangle } from "lucide-react";

type Lang = "no" | "en";

type AuditStatus = "approved" | "pending" | "escalated";

type AuditEntry = {
  timestamp: string;
  agent: { no: string; en: string };
  action: { no: string; en: string };
  status: AuditStatus;
};

const SAMPLE_AUDIT_LOG: AuditEntry[] = [
  {
    timestamp: "09:12",
    agent: { no: "Fakturabehandler", en: "Invoice processor" },
    action: {
      no: "Flagget prisavvik på faktura #2025-0847 fra Nordkyst Logistikk.",
      en: "Flagged price deviation on invoice #2025-0847 from Nordkyst Logistikk.",
    },
    status: "escalated",
  },
  {
    timestamp: "09:47",
    agent: { no: "Møtereferent", en: "Meeting summariser" },
    action: {
      no: "Oppsummerte ledermøte kl 09:00 — 4 beslutninger, 6 aksjonspunkter.",
      en: "Summarised leadership meeting at 09:00 — 4 decisions, 6 action items.",
    },
    status: "approved",
  },
  {
    timestamp: "10:23",
    agent: { no: "Henvendelsesbehandler", en: "Query handler" },
    action: {
      no: "Foreslo svar på kundeklage #CS-1204. Venter på godkjenning.",
      en: "Drafted response to customer complaint #CS-1204. Awaiting approval.",
    },
    status: "pending",
  },
  {
    timestamp: "11:05",
    agent: { no: "Budsjettmonitor", en: "Budget monitor" },
    action: {
      no: "Varslet 12% overforbruk på markedsbudsjett februar.",
      en: "Notified 12% overspend on February marketing budget.",
    },
    status: "approved",
  },
  {
    timestamp: "11:42",
    agent: { no: "Innholdsprodusent", en: "Content producer" },
    action: {
      no: "Utkast til LinkedIn-innlegg om bærekraftsrapport. Venter på godkjenning.",
      en: "Drafted LinkedIn post about sustainability report. Awaiting approval.",
    },
    status: "pending",
  },
];

function StatusChip({ status, lang }: { status: AuditStatus; lang: Lang }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-space-2 py-0.5 rounded-full bg-primary/10 text-primary font-body text-xs font-medium">
        <Check className="w-3 h-3" />
        {lang === "no" ? "Godkjent" : "Approved"}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-space-2 py-0.5 rounded-full bg-accent/25 text-foreground font-body text-xs font-medium">
        <Clock className="w-3 h-3" />
        {lang === "no" ? "Venter" : "Pending"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-space-2 py-0.5 rounded-full bg-terracotta/15 text-terracotta font-body text-xs font-medium">
      <AlertTriangle className="w-3 h-3" />
      {lang === "no" ? "Eskalert" : "Escalated"}
    </span>
  );
}

export function TrustSection({ lang }: { lang: Lang }) {
  const pillars = [
    {
      icon: Lock,
      title: lang === "no" ? "GDPR by design" : "GDPR by design",
      body:
        lang === "no"
          ? "Ingen helautomatiserte beslutninger om enkeltpersoner (Art 22). Dataminimering og tydelige grensesnitt for innsyn, retting og sletting."
          : "No fully automated decisions about individuals (Art 22). Data minimisation and clear interfaces for access, correction and deletion.",
    },
    {
      icon: MapPin,
      title: lang === "no" ? "EU-datalagring" : "EU data residency",
      body:
        lang === "no"
          ? "All databehandling og lagring innen EU (Frankfurt / Stockholm). Ingen kundedata forlater EØS. Schrems II-kompatibelt."
          : "All processing and storage within the EU (Frankfurt / Stockholm). No customer data leaves the EEA. Schrems II compliant.",
    },
    {
      icon: Eye,
      title: lang === "no" ? "Menneske i førersetet" : "Human in charge",
      body:
        lang === "no"
          ? "Full revisjonslogg. Alle agenter kan nedgraderes eller stanses umiddelbart. Du bestemmer hva som kan auto-utføres, hva som krever godkjenning."
          : "Full audit trail. All agents can be downgraded or stopped instantly. You decide what auto-executes and what requires approval.",
    },
    {
      icon: FileCheck,
      title: lang === "no" ? "Ingen trening på dine data" : "No training on your data",
      body:
        lang === "no"
          ? "Innholdet ditt brukes aldri til å trene underliggende modeller. Databehandleravtale (DPA) med alle modellleverandører."
          : "Your content is never used to train underlying models. Data processing agreement (DPA) with all model providers.",
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-space-6 md:p-space-8 space-y-space-6">
      {/* Header */}
      <div className="flex items-start gap-space-4">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {lang === "no" ? "Tillit og sikkerhet" : "Trust and security"}
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-medium text-foreground tracking-headline mt-space-2 leading-tight">
            {lang === "no"
              ? "Bygd for nordisk personvern — fra dag én."
              : "Built for Nordic privacy — from day one."}
          </h3>
          <p className="font-body text-sm text-muted-foreground leading-reading mt-space-2 max-w-[52ch]">
            {lang === "no"
              ? "Tillit er en forutsetning, ikke et tillegg. Her er hva det betyr i praksis for en norsk daglig leder."
              : "Trust is a prerequisite, not an add-on. Here is what that means in practice for a Nordic business owner."}
          </p>
        </div>
      </div>

      {/* Four pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="bg-background border border-border rounded-lg p-space-5 space-y-space-2"
            >
              <div className="flex items-center gap-space-3">
                <Icon className="w-5 h-5 text-terracotta shrink-0" />
                <h4 className="font-display text-lg font-medium text-foreground tracking-headline">
                  {p.title}
                </h4>
              </div>
              <p className="font-body text-sm text-muted-foreground leading-reading">
                {p.body}
              </p>
            </div>
          );
        })}
      </div>

      {/* Sample audit log */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="p-space-5 border-b border-border flex items-start justify-between flex-wrap gap-space-3">
          <div>
            <div className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {lang === "no" ? "Eksempel på revisjonslogg" : "Sample audit log"}
            </div>
            <h4 className="font-display text-lg font-medium text-foreground tracking-headline mt-1">
              {lang === "no"
                ? "Alt agentene gjør — synlig og reversibelt."
                : "Everything agents do — visible and reversible."}
            </h4>
          </div>
          <div className="font-body text-xs text-muted-foreground">
            {lang === "no" ? "I dag · torsdag" : "Today · Thursday"}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {SAMPLE_AUDIT_LOG.map((entry, i) => (
            <li
              key={i}
              className="p-space-4 flex items-start gap-space-4 flex-wrap md:flex-nowrap"
            >
              <div className="font-body text-xs text-muted-foreground w-12 shrink-0 pt-0.5 tabular-nums">
                {entry.timestamp}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-body text-sm font-medium text-foreground">
                  {entry.agent[lang]}
                </div>
                <div className="font-body text-xs text-muted-foreground leading-reading mt-0.5">
                  {entry.action[lang]}
                </div>
              </div>
              <div className="shrink-0">
                <StatusChip status={entry.status} lang={lang} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
