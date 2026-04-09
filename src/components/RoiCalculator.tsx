import { useEffect, useMemo, useState } from "react";
import { BarChart2, ArrowRight } from "lucide-react";

type Lang = "no" | "en";

type CategoryKey =
  | "operations"
  | "finance"
  | "hr"
  | "customer"
  | "marketing"
  | "it"
  | "leadership";

/**
 * Per-category assumption: what share of admin/repetitive time this agent
 * family typically reclaims. Conservative numbers based on pilot data from
 * Nordic SMB rollouts — not guarantees.
 */
const CATEGORIES: Array<{
  key: CategoryKey;
  label: { no: string; en: string };
  automationPct: number;
  description: { no: string; en: string };
}> = [
  {
    key: "finance",
    label: { no: "Økonomi og administrasjon", en: "Finance and admin" },
    automationPct: 40,
    description: {
      no: "Fakturabehandling, budsjettmonitor, månedsrapporter.",
      en: "Invoice processing, budget monitoring, monthly reports.",
    },
  },
  {
    key: "customer",
    label: { no: "Kundeservice og salg", en: "Customer service and sales" },
    automationPct: 35,
    description: {
      no: "Henvendelsesbehandling, oppfølging, salgsstøtte.",
      en: "Query handling, follow-ups, sales support.",
    },
  },
  {
    key: "marketing",
    label: { no: "Marked og innhold", en: "Marketing and content" },
    automationPct: 30,
    description: {
      no: "Utkast til LinkedIn, nyhetsbrev, nettside, SEO.",
      en: "LinkedIn, newsletter, website and SEO drafts.",
    },
  },
  {
    key: "operations",
    label: { no: "Drift og operasjoner", en: "Operations" },
    automationPct: 25,
    description: {
      no: "Møtereferater, dokumentflyt, prosessovervåking.",
      en: "Meeting minutes, document flow, process monitoring.",
    },
  },
  {
    key: "hr",
    label: { no: "HR og personal", en: "HR and people" },
    automationPct: 20,
    description: {
      no: "Onboarding, rekrutteringssortering, opplæring.",
      en: "Onboarding, recruitment sorting, training.",
    },
  },
  {
    key: "it",
    label: { no: "IT og systemer", en: "IT and systems" },
    automationPct: 20,
    description: {
      no: "Feilmeldinger, systemdokumentasjon, integrasjoner.",
      en: "Error logs, system documentation, integrations.",
    },
  },
  {
    key: "leadership",
    label: { no: "Lederstøtte", en: "Leadership support" },
    automationPct: 15,
    description: {
      no: "Statusoversikter, møteforberedelse, beslutningsstøtte.",
      en: "Status overviews, meeting prep, decision support.",
    },
  },
];

const STORAGE_KEY = "employees361-roi-v1";

type State = {
  employees: number;
  hoursPerWeek: number;
  hourlyCost: number;
  selected: CategoryKey[];
};

const DEFAULT_STATE: State = {
  employees: 15,
  hoursPerWeek: 8,
  hourlyCost: 850,
  selected: ["finance", "customer", "operations"],
};

function loadState(): State {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      employees: typeof parsed.employees === "number" ? parsed.employees : DEFAULT_STATE.employees,
      hoursPerWeek:
        typeof parsed.hoursPerWeek === "number" ? parsed.hoursPerWeek : DEFAULT_STATE.hoursPerWeek,
      hourlyCost:
        typeof parsed.hourlyCost === "number" ? parsed.hourlyCost : DEFAULT_STATE.hourlyCost,
      selected: Array.isArray(parsed.selected) ? parsed.selected : DEFAULT_STATE.selected,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function formatNok(n: number): string {
  return new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function RoiCalculator({
  lang,
  onOpenBooking,
}: {
  lang: Lang;
  onOpenBooking: (seed: { company?: string; summary: string }) => void;
}) {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  // Hydrate from localStorage after mount (avoids SSR mismatch though we're CSR only)
  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / unavailable
    }
  }, [state]);

  function toggleCategory(key: CategoryKey) {
    setState((s) => ({
      ...s,
      selected: s.selected.includes(key)
        ? s.selected.filter((k) => k !== key)
        : [...s.selected, key],
    }));
  }

  const results = useMemo(() => {
    const totalAdminHoursMonth = state.employees * state.hoursPerWeek * 4.33;
    const selectedCats = CATEGORIES.filter((c) => state.selected.includes(c.key));
    // Weighted automation: average the % across selected categories, cap at 65%
    // so the output stays conservative even if everything is selected.
    const avgPct =
      selectedCats.length > 0
        ? selectedCats.reduce((acc, c) => acc + c.automationPct, 0) / selectedCats.length
        : 0;
    const combinedPct = Math.min(65, avgPct * Math.min(1, 0.6 + 0.1 * selectedCats.length));

    const hoursSavedMonth = totalAdminHoursMonth * (combinedPct / 100);
    const nokSavedMonth = hoursSavedMonth * state.hourlyCost;
    const nokSavedYear = nokSavedMonth * 12;
    // 1 FTE ≈ 160 hours/month
    const fteEquivalent = hoursSavedMonth / 160;
    // Implementation estimate: loosely 4 weeks × (avg) effort
    const paybackMonths =
      nokSavedMonth > 0 ? Math.max(1, Math.round((75_000 / nokSavedMonth) * 10) / 10) : 0;

    return {
      totalAdminHoursMonth,
      hoursSavedMonth,
      nokSavedMonth,
      nokSavedYear,
      fteEquivalent,
      combinedPct,
      paybackMonths,
    };
  }, [state]);

  function handleBookingClick() {
    const summary =
      lang === "no"
        ? `${state.employees} ansatte · ${state.hoursPerWeek} adm.timer/uke · ${formatNok(results.nokSavedYear)} NOK spart/år · fokus: ${CATEGORIES.filter((c) => state.selected.includes(c.key)).map((c) => c.label.no).join(", ") || "ikke valgt"}`
        : `${state.employees} employees · ${state.hoursPerWeek} admin hrs/week · ${formatNok(results.nokSavedYear)} NOK saved/year · focus: ${CATEGORIES.filter((c) => state.selected.includes(c.key)).map((c) => c.label.en).join(", ") || "none selected"}`;
    onOpenBooking({ summary });
  }

  return (
    <div className="bg-card border border-border rounded-lg p-space-6 md:p-space-8 space-y-space-6">
      {/* Header */}
      <div className="flex items-start gap-space-4">
        <div className="w-12 h-12 rounded-full bg-terracotta text-terracotta-foreground flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">
            {lang === "no" ? "ROI-kalkulator" : "ROI calculator"}
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-medium text-foreground tracking-headline mt-space-2 leading-tight">
            {lang === "no" ? "Hva kan virksomheten din spare?" : "What could your business save?"}
          </h3>
          <p className="font-body text-sm text-muted-foreground leading-reading mt-space-2 max-w-[52ch]">
            {lang === "no"
              ? "Juster tallene til din virkelighet. Anslagene bygger på faktiske pilotprosjekter i nordiske SMB-er — nøkterne, ikke optimistiske."
              : "Adjust the numbers to match your reality. Estimates are based on actual pilot projects in Nordic SMBs — grounded, not optimistic."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-space-6">
        {/* Inputs */}
        <div className="space-y-space-5">
          {/* Employees */}
          <div>
            <div className="flex items-baseline justify-between mb-space-2">
              <label className="font-body text-sm font-medium text-foreground">
                {lang === "no" ? "Antall ansatte" : "Number of employees"}
              </label>
              <span className="font-display text-xl font-medium text-terracotta">
                {state.employees}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={state.employees}
              onChange={(e) =>
                setState((s) => ({ ...s, employees: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-terracotta"
            />
          </div>

          {/* Hours/week */}
          <div>
            <div className="flex items-baseline justify-between mb-space-2">
              <label className="font-body text-sm font-medium text-foreground">
                {lang === "no"
                  ? "Adm.timer per ansatt per uke"
                  : "Admin hours per employee per week"}
              </label>
              <span className="font-display text-xl font-medium text-terracotta">
                {state.hoursPerWeek}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={state.hoursPerWeek}
              onChange={(e) =>
                setState((s) => ({ ...s, hoursPerWeek: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-terracotta"
            />
            <p className="font-body text-xs text-muted-foreground mt-1">
              {lang === "no"
                ? "Gjennomsnitt for rapporter, e-post, dokumentarbeid, møtereferater."
                : "Average for reports, email, document work, meeting notes."}
            </p>
          </div>

          {/* Hourly cost */}
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-space-2">
              {lang === "no" ? "Belastet timekostnad (NOK)" : "Loaded hourly cost (NOK)"}
            </label>
            <input
              type="number"
              min={200}
              max={3000}
              step={50}
              value={state.hourlyCost}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  hourlyCost: Math.max(0, parseInt(e.target.value || "0", 10)),
                }))
              }
              className="w-full bg-background border border-border rounded-lg px-space-3 py-space-2 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="font-body text-xs text-muted-foreground mt-1">
              {lang === "no"
                ? "Timekost inkludert sosiale kostnader, utstyr og lokaler."
                : "Hourly cost including social costs, equipment and premises."}
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="font-body text-sm font-medium text-foreground block mb-space-3">
              {lang === "no"
                ? "Hvilke agentkategorier vil du bruke?"
                : "Which agent categories would you use?"}
            </label>
            <div className="space-y-space-2">
              {CATEGORIES.map((cat) => {
                const selected = state.selected.includes(cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => toggleCategory(cat.key)}
                    className={`w-full text-left px-space-4 py-space-3 rounded-lg border transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:border-terracotta/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-space-3">
                      <div className="flex-1">
                        <div className="font-body text-sm font-medium">{cat.label[lang]}</div>
                        <div
                          className={`font-body text-xs mt-1 leading-reading ${
                            selected ? "text-primary-foreground/75" : "text-muted-foreground"
                          }`}
                        >
                          {cat.description[lang]}
                        </div>
                      </div>
                      <div
                        className={`font-display text-sm font-medium shrink-0 ${
                          selected ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        ~{cat.automationPct}%
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-space-4">
          <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-5">
            <div className="font-body text-xs uppercase tracking-wider text-accent">
              {lang === "no" ? "Estimert gevinst" : "Estimated gain"}
            </div>

            <div>
              <div className="font-body text-xs text-primary-foreground/70">
                {lang === "no" ? "Spart per måned" : "Saved per month"}
              </div>
              <div className="font-display text-4xl md:text-5xl font-bold text-accent leading-none">
                {formatNok(results.nokSavedMonth)}{" "}
                <span className="text-2xl text-accent/80">NOK</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-space-4 pt-space-3 border-t border-white/15">
              <div>
                <div className="font-body text-xs text-primary-foreground/70">
                  {lang === "no" ? "Timer/mnd reddet" : "Hours/month reclaimed"}
                </div>
                <div className="font-display text-2xl font-medium text-primary-foreground">
                  {Math.round(results.hoursSavedMonth)}
                </div>
              </div>
              <div>
                <div className="font-body text-xs text-primary-foreground/70">
                  {lang === "no" ? "FTE-ekvivalent" : "FTE equivalent"}
                </div>
                <div className="font-display text-2xl font-medium text-primary-foreground">
                  {results.fteEquivalent.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="font-body text-xs text-primary-foreground/70">
                  {lang === "no" ? "Årlig gevinst" : "Annual gain"}
                </div>
                <div className="font-display text-2xl font-medium text-primary-foreground">
                  {formatNok(results.nokSavedYear)}
                </div>
              </div>
              <div>
                <div className="font-body text-xs text-primary-foreground/70">
                  {lang === "no" ? "Tilbakebetaling" : "Payback"}
                </div>
                <div className="font-display text-2xl font-medium text-primary-foreground">
                  {results.paybackMonths > 0
                    ? `${results.paybackMonths} ${lang === "no" ? "mnd" : "mo"}`
                    : "—"}
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-primary-foreground/60 leading-reading">
              {lang === "no"
                ? `Estimatet bygger på ~${Math.round(results.combinedPct)}% automatisering av ${Math.round(results.totalAdminHoursMonth)} admin-timer/mnd. Tall fra pilotprosjekter — faktisk gevinst varierer med arbeidsflyt og dataflyt.`
                : `Estimate assumes ~${Math.round(results.combinedPct)}% automation of ${Math.round(results.totalAdminHoursMonth)} admin hours/month. Numbers from pilot projects — actual results vary with workflow and data setup.`}
            </p>
          </div>

          <button
            onClick={handleBookingClick}
            className="w-full h-[52px] bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-space-2"
          >
            {lang === "no"
              ? "Book en samtale med disse tallene"
              : "Book a call with these numbers"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
