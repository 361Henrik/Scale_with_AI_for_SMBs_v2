import { Settings, BarChart2, Users, MessageCircle, Rss, Monitor, Briefcase } from "lucide-react";
import type { AgentDefinition, Category, SkillGroup } from "../types";

export const agentsByCategory: Record<string, AgentDefinition[]> = {
  "Drift og operasjoner": [
    {
      name: { no: "Prosessovervåker", en: "Process monitor" },
      description: {
        no: "Holder øye med fremdrift på løpende prosesser og varsler ved avvik. Gir deg oversikt uten at du må spørre.",
        en: "Monitors progress on ongoing processes and alerts on deviations. Gives you overview without you having to ask."
      },
      baseSkills: { no: ["Overvåking", "Varsling", "Rapportering"], en: ["Monitoring", "Alerting", "Reporting"] },
      mode: "Autonom"
    },
    {
      name: { no: "Møtereferent", en: "Meeting summariser" },
      description: {
        no: "Oppsummerer møter, fordeler oppgaver og følger opp frister. Ingenting forsvinner etter møteslutt.",
        en: "Summarises meetings, distributes tasks and follows up deadlines. Nothing is lost after the meeting ends."
      },
      baseSkills: { no: ["Transkripsjon", "Oppgavedeling", "Oppfølging"], en: ["Transcription", "Task distribution", "Follow-up"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Dokumentflytassistent", en: "Document flow assistant" },
      description: {
        no: "Håndterer rutinedokumenter fra mottak til arkivering. Reduserer manuell behandling av standardsaker.",
        en: "Handles routine documents from receipt to archiving. Reduces manual processing of standard cases."
      },
      baseSkills: { no: ["Dokumentlesing", "Klassifisering", "Arkivering"], en: ["Document reading", "Classification", "Archiving"] },
      mode: "Ko-pilot"
    }
  ],
  "Økonomi og administrasjon": [
    {
      name: { no: "Fakturabehandler", en: "Invoice processor" },
      description: {
        no: "Leser innkommende fakturaer, validerer mot bestillinger og klargjør for godkjenning. Ingen manuell inntasting.",
        en: "Reads incoming invoices, validates against orders and prepares for approval. No manual data entry."
      },
      baseSkills: { no: ["Dokumentlesing", "Validering", "Klargjøring"], en: ["Document reading", "Validation", "Preparation"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Budsjettmonitor", en: "Budget monitor" },
      description: {
        no: "Følger forbruk mot budsjett og varsler tidlig ved avvik. Gir deg tall før møtene, ikke i dem.",
        en: "Tracks spending against budget and alerts early on deviations. Gives you the numbers before meetings, not in them."
      },
      baseSkills: { no: ["Datahenting", "Analyse", "Varsling"], en: ["Data retrieval", "Analysis", "Alerting"] },
      mode: "Autonom"
    },
    {
      name: { no: "Rapportgenerator", en: "Report generator" },
      description: {
        no: "Kompilerer månedlige og ukentlige rapporter automatisk fra definerte datakilder.",
        en: "Automatically compiles monthly and weekly reports from defined data sources."
      },
      baseSkills: { no: ["Datahenting", "Formatering", "Distribusjon"], en: ["Data retrieval", "Formatting", "Distribution"] },
      mode: "Autonom"
    }
  ],
  "HR og personal": [
    {
      name: { no: "Onboardingsguide", en: "Onboarding guide" },
      description: {
        no: "Guider nye medarbeidere gjennom de første dagene med riktig informasjon til rett tid.",
        en: "Guides new employees through their first days with the right information at the right time."
      },
      baseSkills: { no: ["Kunnskapsbase", "Sekvensering", "Oppfølging"], en: ["Knowledge base", "Sequencing", "Follow-up"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Rekrutteringsassistent", en: "Recruitment assistant" },
      description: {
        no: "Sorterer CV-er, sender standardsvar og koordinerer intervjulogistikk.",
        en: "Sorts CVs, sends standard replies and coordinates interview logistics."
      },
      baseSkills: { no: ["Dokumentlesing", "Kommunikasjon", "Planlegging"], en: ["Document reading", "Communication", "Planning"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Opplæringsagent", en: "Training agent" },
      description: {
        no: "Leverer kursinnhold, sjekker forståelse og tilpasser tempo til den enkelte.",
        en: "Delivers training content, checks understanding and adapts pace to the individual."
      },
      baseSkills: { no: ["Innholdsleveranse", "Vurdering", "Tilpasning"], en: ["Content delivery", "Assessment", "Adaptation"] },
      mode: "Orkestrert"
    }
  ],
  "Kundeservice og salg": [
    {
      name: { no: "Henvendelsesbehandler", en: "Query handler" },
      description: {
        no: "Klassifiserer og besvarer rutinehenvendelser. Eskalerer kun det som krever menneskelig vurdering.",
        en: "Classifies and answers routine queries. Escalates only what requires human judgment."
      },
      baseSkills: { no: ["Klassifisering", "Svargenerering", "Eskalering"], en: ["Classification", "Response generation", "Escalation"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Oppfølgingsagent", en: "Follow-up agent" },
      description: {
        no: "Sender strukturerte oppfølginger etter møter, leveranser og kjøp.",
        en: "Sends structured follow-ups after meetings, deliveries and purchases."
      },
      baseSkills: { no: ["Kommunikasjon", "Sekvensering", "Personalisering"], en: ["Communication", "Sequencing", "Personalisation"] },
      mode: "Autonom"
    },
    {
      name: { no: "Salgsstøtte", en: "Sales support" },
      description: {
        no: "Forbereder møter, oppsummerer kundeinformasjon og lager tilbudsforslag.",
        en: "Prepares meetings, summarises customer information and drafts proposals."
      },
      baseSkills: { no: ["Research", "Dokumentproduksjon", "CRM-oppdatering"], en: ["Research", "Document production", "CRM update"] },
      mode: "Orkestrert"
    }
  ],
  "Marked og innhold": [
    {
      name: { no: "Innholdsprodusent", en: "Content producer" },
      description: {
        no: "Gjør interne notater og erfaringer om til ferdig innhold for LinkedIn, nyhetsbrev og nettside.",
        en: "Turns internal notes and experiences into finished content for LinkedIn, newsletters and website."
      },
      baseSkills: { no: ["Skriving", "Kanaltilpasning", "Tonesjekk"], en: ["Writing", "Channel adaptation", "Tone check"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "SEO-assistent", en: "SEO assistant" },
      description: {
        no: "Analyserer eksisterende innhold og foreslår forbedringer for synlighet.",
        en: "Analyses existing content and suggests improvements for visibility."
      },
      baseSkills: { no: ["Analyse", "Skriving", "Søkeordmapping"], en: ["Analysis", "Writing", "Keyword mapping"] },
      mode: "Orkestrert"
    },
    {
      name: { no: "Kampanjeplanlegger", en: "Campaign planner" },
      description: {
        no: "Strukturerer kampanjeplaner og koordinerer innhold på tvers av kanaler.",
        en: "Structures campaign plans and coordinates content across channels."
      },
      baseSkills: { no: ["Planlegging", "Koordinering", "Rapportering"], en: ["Planning", "Coordination", "Reporting"] },
      mode: "Ko-pilot"
    }
  ],
  "IT og systemer": [
    {
      name: { no: "Systemdokumenterer", en: "System documenter" },
      description: {
        no: "Holder teknisk dokumentasjon oppdatert basert på endringer i systemer og prosesser.",
        en: "Keeps technical documentation updated based on changes in systems and processes."
      },
      baseSkills: { no: ["Dokumentlesing", "Skriving", "Arkivering"], en: ["Document reading", "Writing", "Archiving"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Feilmeldingsagent", en: "Error log agent" },
      description: {
        no: "Logger, klassifiserer og ruter feilmeldinger til riktig behandler med kontekst.",
        en: "Logs, classifies and routes error messages to the right handler with context."
      },
      baseSkills: { no: ["Klassifisering", "Logging", "Routing"], en: ["Classification", "Logging", "Routing"] },
      mode: "Autonom"
    },
    {
      name: { no: "Integrasjonsmonitor", en: "Integration monitor" },
      description: {
        no: "Overvåker dataflyt mellom systemer og varsler ved brudd eller forsinkelser.",
        en: "Monitors data flow between systems and alerts on breaks or delays."
      },
      baseSkills: { no: ["Overvåking", "Varsling", "Logging"], en: ["Monitoring", "Alerting", "Logging"] },
      mode: "Autonom"
    }
  ],
  "Lederstøtte": [
    {
      name: { no: "Beslutningsstøtte", en: "Decision support" },
      description: {
        no: "Kompilerer relevant informasjon og alternativer før viktige beslutninger.",
        en: "Compiles relevant information and options before important decisions."
      },
      baseSkills: { no: ["Research", "Analyse", "Oppsummering"], en: ["Research", "Analysis", "Summarisation"] },
      mode: "Orkestrert"
    },
    {
      name: { no: "Møteforberedelse", en: "Meeting preparation" },
      description: {
        no: "Leser agendaer, henter relevant bakgrunnsmateriale og lager briefer for hvert punkt.",
        en: "Reads agendas, retrieves relevant background material and creates briefs for each item."
      },
      baseSkills: { no: ["Dokumentlesing", "Oppsummering", "Klargjøring"], en: ["Document reading", "Summarisation", "Preparation"] },
      mode: "Ko-pilot"
    },
    {
      name: { no: "Statusoversikt", en: "Status overview" },
      description: {
        no: "Gir daglig eller ukentlig oversikt over fremdrift på prioriterte initiativer.",
        en: "Provides daily or weekly overview of progress on prioritised initiatives."
      },
      baseSkills: { no: ["Datahenting", "Oppsummering", "Distribusjon"], en: ["Data retrieval", "Summarisation", "Distribution"] },
      mode: "Autonom"
    }
  ]
};

export const categories: Category[] = [
  {
    id: "operations",
    icon: Settings,
    no: { title: "Drift og operasjoner", desc: "Prosesser, logistikk og daglig operasjonell støtte" },
    en: { title: "Operations", desc: "Processes, logistics and daily operational support" }
  },
  {
    id: "finance",
    icon: BarChart2,
    no: { title: "Økonomi og administrasjon", desc: "Faktura, rapportering, budsjett og administrative oppgaver" },
    en: { title: "Finance & admin", desc: "Invoicing, reporting, budgeting and administrative tasks" }
  },
  {
    id: "hr",
    icon: Users,
    no: { title: "HR og personal", desc: "Rekruttering, onboarding, opplæring og medarbeiderstøtte" },
    en: { title: "HR & people", desc: "Recruitment, onboarding, training and employee support" }
  },
  {
    id: "customer",
    icon: MessageCircle,
    no: { title: "Kundeservice og salg", desc: "Henvendelser, oppfølging, salg og relasjonsbygging" },
    en: { title: "Customer & sales", desc: "Queries, follow-up, sales and relationship building" }
  },
  {
    id: "marketing",
    icon: Rss,
    no: { title: "Marked og innhold", desc: "Innholdsproduksjon, synlighet og kommunikasjon" },
    en: { title: "Marketing & content", desc: "Content production, visibility and communication" }
  },
  {
    id: "it",
    icon: Monitor,
    no: { title: "IT og systemer", desc: "Systemer, integrasjoner og teknisk støtte" },
    en: { title: "IT & systems", desc: "Systems, integrations and technical support" }
  },
  {
    id: "leadership",
    icon: Briefcase,
    no: { title: "Lederstøtte", desc: "Beslutningsstøtte, rapportering og strategisk oversikt" },
    en: { title: "Leadership support", desc: "Decision support, reporting and strategic overview" }
  }
];

export const skillSuggestions: Record<string, string> = {
  "Les regneark": "Generer rapport",
  "Les spreadsheet": "Generate report",
  "Send e-post": "Logg hendelse",
  "Send email": "Log event",
  "Oppsummer dokument": "Trekk ut nøkkeltall",
  "Summarise document": "Extract key figures",
  "Hent fra CRM": "Opprett post i CRM",
  "Fetch from CRM": "Create CRM record",
  "Klassifiser innhold": "Send e-post",
  "Classify content": "Send email",
  "Generer innsikt": "Oppdater dashboard",
  "Generate insight": "Update dashboard",
  "Datahenting": "Generer rapport",
  "Data retrieval": "Generate report",
  "Kommunikasjon": "Logg hendelse",
  "Communication": "Log event"
};

export const skillGroups: SkillGroup[] = [
  {
    no: "DATATILGANG",
    en: "Data access",
    skills: {
      no: ["Les regneark", "Søk i database", "Hent fra CRM", "Les e-post", "Hent fra kalender", "Les fra SharePoint"],
      en: ["Read spreadsheet", "Search database", "Fetch from CRM", "Read email", "Fetch from calendar", "Read from SharePoint"]
    }
  },
  {
    no: "KOMMUNIKASJON",
    en: "Communication",
    skills: {
      no: ["Send e-post", "Post til Slack", "Oppsummer tråd", "Lag svarsforslag", "Send SMS-varsling", "Book møte"],
      en: ["Send email", "Post to Slack", "Summarise thread", "Draft reply", "Send SMS alert", "Book meeting"]
    }
  },
  {
    no: "ANALYSE",
    en: "Analysis",
    skills: {
      no: ["Oppsummer dokument", "Trekk ut nøkkeltall", "Sammenlign alternativer", "Klassifiser innhold", "Generer innsikt", "Sjekk avvik"],
      en: ["Summarise document", "Extract key figures", "Compare options", "Classify content", "Generate insight", "Check deviations"]
    }
  },
  {
    no: "HANDLING",
    en: "Action",
    skills: {
      no: ["Opprett post i CRM", "Oppdater status", "Utløs arbeidsflyt", "Opprett oppgave", "Fyll ut skjema", "Arkiver dokument"],
      en: ["Create CRM record", "Update status", "Trigger workflow", "Create task", "Fill form", "Archive document"]
    }
  },
  {
    no: "RAPPORTERING",
    en: "Reporting",
    skills: {
      no: ["Generer rapport", "Oppdater dashboard", "Send digest", "Lag presentasjon", "Logg hendelse"],
      en: ["Generate report", "Update dashboard", "Send digest", "Create presentation", "Log event"]
    }
  }
];
