import { useEffect, useRef, useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Mail,
  Calendar,
  Building2,
  Target,
  Settings,
  User,
} from "lucide-react";
import { claude, CLAUDE_MODEL, hasClaudeKey } from "../lib/claude";

type Lang = "no" | "en";

export type BookingSeed = {
  company?: string;
  summary?: string;
};

const BOTTLENECKS: Array<{ key: string; no: string; en: string }> = [
  { key: "finance", no: "Økonomi og admin", en: "Finance and admin" },
  { key: "customer", no: "Kundeservice og salg", en: "Customer service and sales" },
  { key: "marketing", no: "Marked og innhold", en: "Marketing and content" },
  { key: "operations", no: "Drift og operasjoner", en: "Operations" },
  { key: "hr", no: "HR og personal", en: "HR and people" },
  { key: "reporting", no: "Rapportering og analyse", en: "Reporting and analysis" },
];

const TOOLS: Array<{ key: string; label: string }> = [
  { key: "m365", label: "Microsoft 365" },
  { key: "gw", label: "Google Workspace" },
  { key: "fiken", label: "Fiken" },
  { key: "tripletex", label: "Tripletex" },
  { key: "visma", label: "Visma" },
  { key: "poweroffice", label: "PowerOffice" },
  { key: "hubspot", label: "HubSpot" },
  { key: "salesforce", label: "Salesforce" },
  { key: "slack", label: "Slack" },
  { key: "teams", label: "Microsoft Teams" },
];

type FormState = {
  company: string;
  industry: string;
  size: string;
  bottlenecks: string[];
  tools: string[];
  name: string;
  email: string;
  timeWindow: string;
};

const INITIAL: FormState = {
  company: "",
  industry: "",
  size: "",
  bottlenecks: [],
  tools: [],
  name: "",
  email: "",
  timeWindow: "",
};

export function BookingModal({
  open,
  onClose,
  seed,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  seed?: BookingSeed;
  lang: Lang;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // When the modal opens, reset and seed from the trigger
  useEffect(() => {
    if (open) {
      setStep(0);
      setForm({ ...INITIAL, company: seed?.company ?? "" });
      setRecommendation("");
      setError(null);
      setSubmitted(false);
    } else {
      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    }
  }, [open, seed]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  function toggle(list: "bottlenecks" | "tools", key: string) {
    setForm((f) => {
      const arr = f[list];
      return {
        ...f,
        [list]: arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key],
      };
    });
  }

  const canAdvance = (): boolean => {
    if (step === 0) return form.company.trim().length > 0 && form.size.trim().length > 0;
    if (step === 1) return form.bottlenecks.length > 0;
    if (step === 2) return true; // tools optional
    if (step === 3) return form.name.trim().length > 0 && /@/.test(form.email);
    return true;
  };

  async function submit() {
    setLoading(true);
    setError(null);

    const bottleneckList = form.bottlenecks
      .map((k) => {
        const b = BOTTLENECKS.find((x) => x.key === k);
        return b ? b[lang] : k;
      })
      .join(", ");

    const toolList = form.tools
      .map((k) => TOOLS.find((t) => t.key === k)?.label ?? k)
      .join(", ");

    const userPrompt =
      lang === "no"
        ? `Selskap: ${form.company}
Bransje: ${form.industry || "Ikke oppgitt"}
Størrelse: ${form.size} ansatte
Flaskehalser: ${bottleneckList}
Verktøy i bruk: ${toolList || "Ikke oppgitt"}
${seed?.summary ? `ROI-kontekst: ${seed.summary}` : ""}

Foreslå en konkret startpakke for denne SMB-en: 2-3 agenter fra Employees 361-katalogen som ville gitt mest verdi de første 30 dagene, og én setning om hvorfor akkurat de. Vær konkret — bruk agentnavn, ikke generisk prat.`
        : `Company: ${form.company}
Industry: ${form.industry || "Not provided"}
Size: ${form.size} employees
Bottlenecks: ${bottleneckList}
Tools in use: ${toolList || "Not provided"}
${seed?.summary ? `ROI context: ${seed.summary}` : ""}

Suggest a concrete starter pack for this SMB: 2-3 agents from the Employees 361 catalog that would give the most value in the first 30 days, and one sentence on why those specifically. Be concrete — use agent names, not generic talk.`;

    const systemPrompt =
      lang === "no"
        ? `Du er en senior AI-rådgiver som bygger agenter for norske SMB-er. Du kjenner Employees 361-katalogen (Fakturabehandler, Møtereferent, Dokumentflytassistent, Budsjettmonitor, Rapportgenerator, Onboardingsguide, Rekrutteringsassistent, Henvendelsesbehandler, Oppfølgingsagent, Salgsstøtte, Innholdsprodusent, SEO-assistent, Kampanjeplanlegger, Beslutningsstøtte, Statusoversikt).

Svar ALLTID i dette nøyaktige Markdown-formatet:

## Anbefalt startpakke
- **Agentnavn 1** — én setning om hvorfor akkurat denne.
- **Agentnavn 2** — én setning om hvorfor.
- **Agentnavn 3** — én setning om hvorfor.

## Første 30 dager
Ett kort avsnitt (2-3 setninger) om hva som realistisk kan være på plass og målbart etter 30 dager med denne pakken.

## Første samtale
Én setning om hva den første introduksjonssamtalen bør dekke.

Vær nøktern og konkret — ingen hype.`
        : `You are a senior AI advisor building agents for Nordic SMBs. You know the Employees 361 catalog (Invoice processor, Meeting summariser, Document flow assistant, Budget monitor, Report generator, Onboarding guide, Recruitment assistant, Query handler, Follow-up agent, Sales support, Content producer, SEO assistant, Campaign planner, Decision support, Status overview).

ALWAYS respond in this exact Markdown format:

## Recommended starter pack
- **Agent name 1** — one sentence on why specifically this one.
- **Agent name 2** — one sentence on why.
- **Agent name 3** — one sentence on why.

## First 30 days
One short paragraph (2-3 sentences) on what can realistically be live and measurable after 30 days with this pack.

## First conversation
One sentence on what the first intro call should cover.

Be grounded and concrete — no hype.`;

    if (!hasClaudeKey()) {
      // Graceful degradation — no API key available; skip AI recommendation,
      // still show confirmation with a mailto fallback so the lead isn't lost.
      setRecommendation(
        lang === "no"
          ? "_AI-anbefaling ikke tilgjengelig uten ANTHROPIC_API_KEY. Vi tar kontakt direkte basert på svarene dine._"
          : "_AI recommendation unavailable without ANTHROPIC_API_KEY. We'll follow up directly based on your answers._",
      );
      setSubmitted(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const stream = claude.messages.stream(
        {
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        },
        { signal: controller.signal },
      );

      let acc = "";
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          acc += event.delta.text;
          setRecommendation(acc);
        }
      }
      await stream.finalMessage();
      setSubmitted(true);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Booking recommendation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : lang === "no"
            ? "Kunne ikke generere anbefalingen — men vi har fått meldingen din."
            : "Could not generate the recommendation — but we received your message.",
      );
      setSubmitted(true); // still show confirmation; failure shouldn't block the lead
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  }

  function buildMailtoFallback(): string {
    const bottleneckList = form.bottlenecks
      .map((k) => BOTTLENECKS.find((b) => b.key === k)?.[lang] ?? k)
      .join(", ");
    const toolList = form.tools
      .map((k) => TOOLS.find((t) => t.key === k)?.label ?? k)
      .join(", ");

    const subject =
      lang === "no"
        ? `Intro-samtale · ${form.company}`
        : `Intro call · ${form.company}`;

    const body =
      lang === "no"
        ? `Hei ThreeSixtyOne,

${form.name} her fra ${form.company}${form.industry ? ` (${form.industry})` : ""}. Vi har ${form.size} ansatte.

Våre største flaskehalser: ${bottleneckList}
Systemer vi bruker: ${toolList || "ikke oppgitt"}
Ønsket tidspunkt: ${form.timeWindow || "fleksibel"}
${seed?.summary ? `\nROI-kontekst: ${seed.summary}` : ""}

Kontakt: ${form.email}

Ser frem til en prat.`
        : `Hi ThreeSixtyOne,

${form.name} here from ${form.company}${form.industry ? ` (${form.industry})` : ""}. We have ${form.size} employees.

Our biggest bottlenecks: ${bottleneckList}
Systems we use: ${toolList || "not provided"}
Preferred time: ${form.timeWindow || "flexible"}
${seed?.summary ? `\nROI context: ${seed.summary}` : ""}

Contact: ${form.email}

Looking forward to the call.`;

    return `mailto:hei@the361.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const stepTitles =
    lang === "no"
      ? ["Om bedriften", "Flaskehalser", "Verktøystack", "Kontakt"]
      : ["About the company", "Bottlenecks", "Tool stack", "Contact"];

  const stepIcons = [Building2, Target, Settings, User];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-space-5 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background border border-border rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-space-5 md:p-space-6 border-b border-border flex items-start justify-between gap-space-4 shrink-0">
          <div>
            <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">
              {lang === "no" ? "Book en intro-samtale" : "Book an intro call"}
            </div>
            <h3 className="font-display text-xl md:text-2xl font-medium text-foreground tracking-headline mt-1">
              {submitted
                ? lang === "no"
                  ? "Din tilpassede startpakke"
                  : "Your tailored starter pack"
                : stepTitles[step]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {!submitted && (
          <div className="px-space-5 md:px-space-6 py-space-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-space-2">
              {stepTitles.map((t, i) => {
                const Icon = stepIcons[i];
                const active = i === step;
                const done = i < step;
                return (
                  <div key={i} className="flex-1 flex items-center gap-space-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        active
                          ? "bg-terracotta text-terracotta-foreground"
                          : done
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-muted-foreground border border-border"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div
                      className={`font-body text-xs truncate hidden sm:block ${
                        active ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {t}
                    </div>
                    {i < stepTitles.length - 1 && (
                      <div
                        className={`flex-1 h-px ${done ? "bg-primary" : "bg-border"} min-w-space-3`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-space-5 md:p-space-6">
          {submitted ? (
            <div className="space-y-space-5">
              {error && (
                <div className="bg-card border-l-4 border-terracotta rounded-lg p-space-4">
                  <div className="font-body text-xs font-medium uppercase tracking-wider text-terracotta mb-1">
                    {lang === "no" ? "Merk" : "Note"}
                  </div>
                  <p className="font-body text-sm text-foreground leading-reading">{error}</p>
                </div>
              )}
              <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-3">
                <div className="font-body text-xs uppercase tracking-wider text-accent">
                  {lang === "no" ? "Anbefaling generert av Claude" : "Recommendation generated by Claude"}
                </div>
                {recommendation ? (
                  <div className="font-body text-sm text-primary-foreground/90 leading-reading whitespace-pre-wrap">
                    {recommendation}
                  </div>
                ) : (
                  <div className="flex items-center gap-space-2 font-body text-sm text-primary-foreground/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === "no" ? "Genererer..." : "Generating..."}
                  </div>
                )}
              </div>
              <div className="bg-card border border-border rounded-lg p-space-5 space-y-space-3">
                <h4 className="font-display text-base font-medium text-foreground tracking-headline">
                  {lang === "no" ? "Neste steg" : "Next step"}
                </h4>
                <p className="font-body text-sm text-muted-foreground leading-reading">
                  {lang === "no"
                    ? `Takk, ${form.name}. Vi tar kontakt på ${form.email} for å avtale en 30-minutters intro-samtale. Samtalen er uforpliktende — vi går gjennom hvor du står og hva som kan bygges først.`
                    : `Thanks, ${form.name}. We'll reach out to ${form.email} to arrange a 30-minute intro call. The call is no-commitment — we'll walk through where you are and what could be built first.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-space-3 pt-space-2">
                  <a
                    href={buildMailtoFallback()}
                    className="flex-1 h-[44px] bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-space-2"
                  >
                    <Mail className="w-4 h-4" />
                    {lang === "no" ? "Send oss en e-post" : "Email us"}
                  </a>
                  <a
                    href="https://cal.com/the361"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-[44px] bg-background border border-border text-foreground rounded-lg font-body text-sm font-medium hover:bg-card transition-colors flex items-center justify-center gap-space-2"
                  >
                    <Calendar className="w-4 h-4" />
                    {lang === "no" ? "Velg tid direkte" : "Pick a time directly"}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 0 — company */}
              {step === 0 && (
                <div className="space-y-space-4">
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "Bedriftsnavn" : "Company name"} <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder={lang === "no" ? "f.eks. Nordkyst AS" : "e.g. Nordkyst Ltd"}
                      className="w-full bg-card border border-border rounded-lg px-space-3 py-space-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "Bransje" : "Industry"}
                    </label>
                    <input
                      type="text"
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      placeholder={
                        lang === "no"
                          ? "f.eks. regnskap, håndverk, konsulent, handel"
                          : "e.g. accounting, trades, consulting, retail"
                      }
                      className="w-full bg-card border border-border rounded-lg px-space-3 py-space-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "Antall ansatte" : "Number of employees"}{" "}
                      <span className="text-terracotta">*</span>
                    </label>
                    <div className="flex flex-wrap gap-space-2">
                      {["1–5", "6–15", "16–30", "31–60", "60+"].map((range) => (
                        <button
                          key={range}
                          onClick={() => setForm({ ...form, size: range })}
                          className={`px-space-4 py-space-2 rounded-full font-body text-sm transition-colors ${
                            form.size === range
                              ? "bg-terracotta text-terracotta-foreground"
                              : "bg-card text-foreground border border-border hover:border-terracotta/60"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 — bottlenecks */}
              {step === 1 && (
                <div className="space-y-space-3">
                  <p className="font-body text-sm text-muted-foreground leading-reading mb-space-3">
                    {lang === "no"
                      ? "Velg alle områdene der du merker at tiden ikke rekker til. Vi bruker dette til å foreslå riktig startpakke."
                      : "Select every area where time runs short. We use this to suggest the right starter pack."}
                  </p>
                  {BOTTLENECKS.map((b) => {
                    const selected = form.bottlenecks.includes(b.key);
                    return (
                      <button
                        key={b.key}
                        onClick={() => toggle("bottlenecks", b.key)}
                        className={`w-full text-left px-space-4 py-space-3 rounded-lg border transition-colors flex items-center justify-between ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-terracotta/60"
                        }`}
                      >
                        <span className="font-body text-sm font-medium">{b[lang]}</span>
                        {selected && <Check className="w-4 h-4 text-accent" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2 — tools */}
              {step === 2 && (
                <div className="space-y-space-3">
                  <p className="font-body text-sm text-muted-foreground leading-reading mb-space-3">
                    {lang === "no"
                      ? "Hvilke systemer bruker dere i dag? (Valgfritt — hjelper oss foreslå integrasjoner.)"
                      : "Which systems do you currently use? (Optional — helps us suggest integrations.)"}
                  </p>
                  <div className="grid grid-cols-2 gap-space-2">
                    {TOOLS.map((t) => {
                      const selected = form.tools.includes(t.key);
                      return (
                        <button
                          key={t.key}
                          onClick={() => toggle("tools", t.key)}
                          className={`px-space-4 py-space-3 rounded-lg border transition-colors flex items-center justify-between ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-terracotta/60"
                          }`}
                        >
                          <span className="font-body text-sm">{t.label}</span>
                          {selected && <Check className="w-4 h-4 text-accent shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3 — contact */}
              {step === 3 && (
                <div className="space-y-space-4">
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "Ditt navn" : "Your name"} <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={lang === "no" ? "Kari Nordmann" : "Alex Smith"}
                      className="w-full bg-card border border-border rounded-lg px-space-3 py-space-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "E-postadresse" : "Email address"}{" "}
                      <span className="text-terracotta">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="kari@example.no"
                      className="w-full bg-card border border-border rounded-lg px-space-3 py-space-3 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-foreground block mb-space-2">
                      {lang === "no" ? "Ønsket tidsrom" : "Preferred time window"}
                    </label>
                    <div className="flex flex-wrap gap-space-2">
                      {(lang === "no"
                        ? ["Denne uken", "Neste uke", "Innen 2 uker", "Fleksibel"]
                        : ["This week", "Next week", "Within 2 weeks", "Flexible"]
                      ).map((t) => (
                        <button
                          key={t}
                          onClick={() => setForm({ ...form, timeWindow: t })}
                          className={`px-space-4 py-space-2 rounded-full font-body text-sm transition-colors ${
                            form.timeWindow === t
                              ? "bg-terracotta text-terracotta-foreground"
                              : "bg-card text-foreground border border-border hover:border-terracotta/60"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className="p-space-5 md:p-space-6 border-t border-border flex items-center justify-between gap-space-3 shrink-0">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={loading}
                className="h-[44px] px-space-4 text-foreground font-body text-sm font-medium hover:bg-card rounded-lg transition-colors flex items-center gap-space-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === "no" ? "Tilbake" : "Back"}
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
                className="h-[44px] px-space-5 bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-space-2"
              >
                {lang === "no" ? "Neste" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canAdvance() || loading}
                className="h-[44px] px-space-5 bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-space-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === "no" ? "Genererer..." : "Generating..."}
                  </>
                ) : (
                  <>
                    {lang === "no" ? "Få min tilpassede startpakke" : "Get my tailored starter pack"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
