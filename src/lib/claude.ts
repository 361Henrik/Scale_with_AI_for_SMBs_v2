import Anthropic from "@anthropic-ai/sdk";

/**
 * Browser-side Anthropic client used by the Roles tab live demos and the
 * qualified booking-flow recommendation.
 *
 * The existing Gemini integration (AIAssistant + AgentBuilder) is left
 * untouched — Claude is additive, powering the new conviction features:
 * live agent demos, qualified booking recommendation.
 *
 * Browser usage requires `dangerouslyAllowBrowser: true`. The API key is
 * baked at build time via vite's `define` (same pattern used for GEMINI_API_KEY).
 * For production this would ideally proxy through a server, but matches the
 * existing Gemini browser pattern for this AI Studio showcase.
 */
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const CLAUDE_MODEL = "claude-opus-4-6";

export function hasClaudeKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return typeof key === "string" && key.length > 0 && key !== "MY_ANTHROPIC_API_KEY";
}

type Lang = "no" | "en";

export type RoleKey =
  | "meeting"
  | "document"
  | "content"
  | "customer"
  | "reporting"
  | "onboarding";

export type DemoConfig = {
  /** Label shown on the "run" button */
  runLabel: { no: string; en: string };
  /** Pre-filled input shown in an editable textarea */
  sampleInput: { no: string; en: string };
  /** Short one-line hint under the input */
  inputHint: { no: string; en: string };
  /** System prompt steering Claude's output shape */
  system: (lang: Lang) => string;
  /** Wraps the user's input into the actual user message */
  buildUser: (input: string, lang: Lang) => string;
};

/**
 * One demo per role. Each uses streaming text output with a system prompt that
 * asks Claude to return a specific Markdown structure — the demo UI parses
 * section headers (## Name) and renders them as cards. This keeps the rendering
 * simple and resilient while still feeling alive via streaming.
 */
export const ROLE_DEMOS: Record<RoleKey, DemoConfig> = {
  meeting: {
    runLabel: {
      no: "Oppsummer møtet",
      en: "Summarise the meeting",
    },
    inputHint: {
      no: "Transkripsjon eller notater fra møtet — bytt ut med dine egne.",
      en: "Meeting transcript or notes — replace with your own.",
    },
    sampleInput: {
      no: `Ukesmøte — mandag 10:00
Til stede: Kari (dl), Ola (salg), Mari (marked), Jonas (drift)

Kari: Vi må prioritere Q2-planen. Ola, hvordan ligger pipelinen an?
Ola: Vi har tre varme leads. Nordkyst AS venter på tilbud — de vil ha svar innen fredag. Jeg trenger Maris hjelp til å oppdatere salgsdekket.
Mari: Jeg kan ha et oppdatert deck klart på onsdag. Men jeg trenger case-tall fra Jonas.
Jonas: Jeg kan levere tallene tirsdag kveld. Forsinkelsen på serveroppgraderingen betyr også at vi bør varsle kundene — anslag 48 timers nedetid kommende helg.
Kari: OK, to ting: Ola skriver tilbud til Nordkyst, ferdig torsdag. Mari oppdaterer deck etter at hun har tallene fra Jonas på tirsdag. Jonas sender kundevarsel i dag.
Ola: Én ting til — vi må bestemme om vi skal delta på Arendalsuka. Beslutning trengs innen neste møte.`,
      en: `Weekly meeting — Monday 10:00
Present: Kari (CEO), Ola (sales), Mari (marketing), Jonas (ops)

Kari: We need to prioritise the Q2 plan. Ola, how is the pipeline looking?
Ola: We have three warm leads. Nordkyst AS is waiting for a proposal — they want an answer by Friday. I need Mari's help to update the sales deck.
Mari: I can have an updated deck ready on Wednesday. But I need case numbers from Jonas.
Jonas: I can deliver the numbers Tuesday evening. The delay on the server upgrade also means we should warn customers — estimated 48 hours downtime next weekend.
Kari: OK, two things: Ola writes a proposal for Nordkyst, done by Thursday. Mari updates the deck after she gets the numbers from Jonas on Tuesday. Jonas sends the customer notification today.
Ola: One more thing — we need to decide whether to attend Arendalsuka. Decision needed before next meeting.`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en norsk møteassistent. Lag et strukturert møtereferat basert på transkripsjonen under. Svar ALLTID i dette nøyaktige Markdown-formatet og INGENTING annet:

## Sammendrag
Ett kort avsnitt (2-3 setninger) med de viktigste punktene.

## Beslutninger
- Beslutning 1
- Beslutning 2

## Aksjonspunkter
- **[Ansvarlig]** — Oppgave — *Frist*
- **[Ansvarlig]** — Oppgave — *Frist*

## Åpne spørsmål
- Spørsmål som må avklares

Vær kortfattet. Bruk norsk. Ikke legg til kommentarer utenfor seksjonene.`
        : `You are a meeting assistant. Create a structured meeting summary based on the transcript below. ALWAYS respond in this exact Markdown format and NOTHING else:

## Summary
One short paragraph (2-3 sentences) with the key points.

## Decisions
- Decision 1
- Decision 2

## Action items
- **[Owner]** — Task — *Deadline*
- **[Owner]** — Task — *Deadline*

## Open questions
- Question that needs clarification

Be concise. Use English. Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },

  document: {
    runLabel: {
      no: "Analyser dokumentet",
      en: "Analyse the document",
    },
    inputHint: {
      no: "Lim inn en faktura, kontrakt eller tilbudstekst.",
      en: "Paste an invoice, contract or proposal text.",
    },
    sampleInput: {
      no: `LEVERANDØRFAKTURA
Fra: Nordkyst Logistikk AS, Org.nr 912 345 678
Til: Employees 361 AS
Fakturanr: 2025-0847
Fakturadato: 2025-03-04
Forfallsdato: 2025-03-18 (14 dager netto)

Beskrivelse                          Antall    À-pris    Sum
Transport Oslo–Bergen (palle)         12       2 450     29 400
Hastetillegg kveldslevering           3        1 800     5 400
Emballasje og sikring                 1        1 200     1 200

Subtotal                                                 36 000
Mva 25%                                                  9 000
Totalt å betale                                          45 000 NOK

Merknad: Prisen på hastetillegg er endret fra 1 200 til 1 800 pr 1. mars.
Standardkontrakt tilsier varsling 30 dager før prisendring.`,
      en: `SUPPLIER INVOICE
From: Nordkyst Logistikk AS, Org.nr 912 345 678
To: Employees 361 AS
Invoice: 2025-0847
Invoice date: 2025-03-04
Due date: 2025-03-18 (14 days net)

Description                          Qty    Unit price   Amount
Transport Oslo–Bergen (pallet)        12     2,450        29,400
Rush surcharge evening delivery       3      1,800        5,400
Packaging and securing                1      1,200        1,200

Subtotal                                                  36,000
VAT 25%                                                   9,000
Total due                                                 45,000 NOK

Note: Rush surcharge price changed from 1,200 to 1,800 as of March 1.
Standard contract requires 30 days notice for price changes.`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en dokumentanalyseagent som leser norske leverandørfakturaer og kontrakter. Analyser dokumentet under og svar ALLTID i dette nøyaktige Markdown-formatet:

## Nøkkelfakta
- **Leverandør:** ...
- **Fakturanr:** ...
- **Beløp:** ...
- **Forfall:** ...

## Avvik og risiko
- Identifiser eventuelle avvik fra standardvilkår, prisendringer, manglende varslinger eller uvanlige klausuler. Hvis alt ser OK ut, skriv "Ingen avvik identifisert".

## Anbefaling
Ett kort avsnitt. Foreslå handling: **Godkjenn**, **Avvis**, eller **Eskaler til menneske** — med begrunnelse.

Vær konkret. Ikke legg til kommentarer utenfor seksjonene.`
        : `You are a document analysis agent that reads supplier invoices and contracts. Analyse the document below and ALWAYS respond in this exact Markdown format:

## Key facts
- **Supplier:** ...
- **Invoice #:** ...
- **Amount:** ...
- **Due:** ...

## Deviations and risks
- Identify any deviations from standard terms, price changes, missing notifications or unusual clauses. If everything looks OK, write "No deviations identified".

## Recommendation
One short paragraph. Suggest an action: **Approve**, **Reject**, or **Escalate to human** — with justification.

Be concrete. Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },

  content: {
    runLabel: {
      no: "Skriv utkast",
      en: "Draft the content",
    },
    inputHint: {
      no: "Stikkord eller råskisse — ett til fire strekpunkter holder.",
      en: "Bullet points or rough notes — one to four lines is enough.",
    },
    sampleInput: {
      no: `Bakgrunn: Vi har nettopp lansert Employees 361 — en ramme for å bygge AI-støttede roller i norske SMB-er.
Nøkkelbudskap:
- Ikke erstatning av mennesker, men mer kapasitet rundt dem
- Menneske i førersetet alltid
- Første operative arbeidsflyt på 30 dager
Ønsket tone: Profesjonell, nøktern, nordisk. Ingen hype.`,
      en: `Background: We just launched Employees 361 — a framework for building AI-supported roles in Nordic SMBs.
Key messages:
- Not replacing people, but more capacity around them
- Human always in charge
- First operational workflow in 30 days
Desired tone: Professional, grounded, Nordic. No hype.`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en innholdsprodusent for en norsk SMB. Ta stikkordene under og lag tre ferdige utkast tilpasset ulike kanaler. Svar ALLTID i dette nøyaktige Markdown-formatet:

## LinkedIn-innlegg
Et innlegg på 3-4 korte avsnitt med én tydelig åpningslinje, tre verdipunkter og ett spørsmål til leseren på slutten. Maks 1200 tegn.

## Nyhetsbrev-paragraf
Ett avsnitt på 70-100 ord. Formelt men varmt. Skrevet som del av et månedlig nyhetsbrev.

## Nettside-blurb
Én setning som fanger essensen. Maks 25 ord. Egnet som undertittel på en landingsside.

Bruk norsk, profesjonell og nøktern tone. Ikke legg til kommentarer utenfor seksjonene.`
        : `You are a content producer for a Nordic SMB. Take the bullet points below and create three finished drafts tailored to different channels. ALWAYS respond in this exact Markdown format:

## LinkedIn post
A post with 3-4 short paragraphs, one clear opening line, three value points, and one question to the reader at the end. Max 1200 characters.

## Newsletter paragraph
One paragraph of 70-100 words. Formal but warm. Written as part of a monthly newsletter.

## Website blurb
A single sentence capturing the essence. Max 25 words. Suitable as a subtitle on a landing page.

Use professional, grounded tone. No hype. Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },

  customer: {
    runLabel: {
      no: "Behandle henvendelsen",
      en: "Handle the enquiry",
    },
    inputHint: {
      no: "Lim inn en kundehenvendelse — e-post eller chat.",
      en: "Paste a customer enquiry — email or chat.",
    },
    sampleInput: {
      no: `Emne: Ordre #12345 — pakken er ikke kommet

Hei,

Jeg bestilte produktet mitt 18. februar og betalte for ekspresslevering. Det skulle kommet senest 22. februar, men nå er det 28. februar og fortsatt ingenting. Jeg har prøvd å spore sendingen, men lenken i bekreftelsen funker ikke.

Dette er tredje gangen på et halvt år at leveringen er forsinket. Jeg begynner å miste tålmodigheten. Enten får jeg pakken i morgen eller så vil jeg ha pengene tilbake — inkludert fraktkostnaden.

Mvh,
Lene Haugen`,
      en: `Subject: Order #12345 — package has not arrived

Hi,

I ordered my product on February 18 and paid for express delivery. It should have arrived by February 22 at the latest, but now it's February 28 and still nothing. I've tried to track the shipment, but the link in the confirmation doesn't work.

This is the third time in six months that delivery has been delayed. I'm starting to lose patience. Either I get the package tomorrow or I want my money back — including the shipping cost.

Regards,
Lene Haugen`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en kundebehandler-agent for en norsk SMB. Analyser henvendelsen under og svar ALLTID i dette nøyaktige Markdown-formatet:

## Klassifisering
- **Kategori:** (Leveranse / Teknisk / Faktura / Klage / Annet)
- **Hastegrad:** (Lav / Middels / Høy / Kritisk)
- **Sentiment:** (Nøytral / Frustrert / Sint / Fornøyd)

## Forslag til svar
Skriv et helhetlig, empatisk svar på norsk (3-5 korte avsnitt). Bekreft problemet, ta ansvar der det er rimelig, og gi et konkret neste steg.

## Anbefaling til menneske
Én setning: **Send automatisk**, **Send etter godkjenning**, eller **Eskaler til menneskelig agent** — med kort begrunnelse.

Ikke legg til kommentarer utenfor seksjonene.`
        : `You are a customer service agent for a Nordic SMB. Analyse the enquiry below and ALWAYS respond in this exact Markdown format:

## Classification
- **Category:** (Delivery / Technical / Billing / Complaint / Other)
- **Urgency:** (Low / Medium / High / Critical)
- **Sentiment:** (Neutral / Frustrated / Angry / Satisfied)

## Suggested reply
Write a complete, empathetic reply (3-5 short paragraphs). Acknowledge the problem, take responsibility where reasonable, and give a concrete next step.

## Recommendation to human
One sentence: **Auto-send**, **Send after approval**, or **Escalate to human agent** — with brief justification.

Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },

  reporting: {
    runLabel: {
      no: "Analyser tallene",
      en: "Analyse the numbers",
    },
    inputHint: {
      no: "Lim inn tall eller KPI-er — agenten tolker dem.",
      en: "Paste numbers or KPIs — the agent will interpret them.",
    },
    sampleInput: {
      no: `Q3 2025 — Salgsresultat per region (mot Q2 2025)

Oslo:      12,4 MNOK  (+8%)
Bergen:     6,8 MNOK  (-3%)
Trondheim:  4,1 MNOK  (+22%)
Stavanger:  5,2 MNOK  (-11%)
Nord-Norge: 2,3 MNOK  (+4%)

Totalt:    30,8 MNOK  (+3%)

Topp 3 produkter (Q3):
1. Premium-pakke: 11,2 MNOK (+15%)
2. Standard-abonnement: 9,8 MNOK (-2%)
3. Konsulent-timer: 5,4 MNOK (+7%)

Budsjett Q3: 32 MNOK. Avvik: -1,2 MNOK (-3,8%)`,
      en: `Q3 2025 — Sales performance by region (vs Q2 2025)

Oslo:       12.4 MNOK  (+8%)
Bergen:      6.8 MNOK  (-3%)
Trondheim:   4.1 MNOK  (+22%)
Stavanger:   5.2 MNOK  (-11%)
Northern:    2.3 MNOK  (+4%)

Total:      30.8 MNOK  (+3%)

Top 3 products (Q3):
1. Premium package: 11.2 MNOK (+15%)
2. Standard subscription: 9.8 MNOK (-2%)
3. Consulting hours: 5.4 MNOK (+7%)

Q3 budget: 32 MNOK. Variance: -1.2 MNOK (-3.8%)`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en rapporteringsagent som tolker salgs- og budsjettdata for en norsk SMB-ledergruppe. Analyser tallene under og svar ALLTID i dette nøyaktige Markdown-formatet:

## Hovedfunn
Ett kort avsnitt (2-3 setninger) som oppsummerer situasjonen på toppnivå.

## Hva driver tallene
- **Positivt:** Punkt 1 — Punkt 2
- **Negativt:** Punkt 1 — Punkt 2

## Anbefalte grep
To til tre konkrete anbefalinger til ledergruppen, hver på én linje.

Bruk norsk. Vær nøktern og konkret — ingen generiske råd. Ikke legg til kommentarer utenfor seksjonene.`
        : `You are a reporting agent that interprets sales and budget data for a Nordic SMB leadership team. Analyse the numbers below and ALWAYS respond in this exact Markdown format:

## Headline finding
One short paragraph (2-3 sentences) summarising the top-level situation.

## What's driving the numbers
- **Positive:** Point 1 — Point 2
- **Negative:** Point 1 — Point 2

## Recommended actions
Two to three concrete recommendations for the leadership team, one line each.

Be grounded and specific — no generic advice. Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },

  onboarding: {
    runLabel: {
      no: "Lag onboarding-plan",
      en: "Draft the onboarding plan",
    },
    inputHint: {
      no: "Beskriv den nyansatte og rollen — ett til tre linjer.",
      en: "Describe the new hire and role — one to three lines.",
    },
    sampleInput: {
      no: `Ny ansatt: Anna Berg, starter som junior-konsulent i rådgivningsteamet.
Bakgrunn: Master i bedriftsøkonomi, to års erfaring fra revisjon.
Ingen tidligere erfaring med våre systemer (Tripletex, HubSpot, Notion, Slack).
Første oppdrag ventet innen to uker.`,
      en: `New hire: Anna Berg, starting as a junior consultant in the advisory team.
Background: Master's in business admin, two years of experience from auditing.
No prior experience with our systems (Tripletex, HubSpot, Notion, Slack).
First assignment expected within two weeks.`,
    },
    system: (lang) =>
      lang === "no"
        ? `Du er en onboarding-assistent for en norsk SMB. Basert på beskrivelsen under, lag en strukturert dag-1-til-uke-2-plan. Svar ALLTID i dette nøyaktige Markdown-formatet:

## Dag 1 — velkomst og oppsett
- Punkt 1
- Punkt 2
- Punkt 3

## Uke 1 — forstå virksomheten
- Punkt 1
- Punkt 2
- Punkt 3

## Uke 2 — første leveranse
- Punkt 1
- Punkt 2
- Punkt 3

## Hva mennesket bør ta
Ett kort avsnitt om hva lederen eller fadderen bør prioritere i 1-til-1 — det AI-en ikke kan erstatte.

Vær konkret og praktisk. Ikke legg til kommentarer utenfor seksjonene.`
        : `You are an onboarding assistant for a Nordic SMB. Based on the description below, create a structured day-1-to-week-2 plan. ALWAYS respond in this exact Markdown format:

## Day 1 — welcome and setup
- Point 1
- Point 2
- Point 3

## Week 1 — understand the business
- Point 1
- Point 2
- Point 3

## Week 2 — first deliverable
- Point 1
- Point 2
- Point 3

## What the human should own
One short paragraph about what the manager or mentor should prioritise in 1-on-1s — the things AI cannot replace.

Be concrete and practical. Do not add comments outside the sections.`,
    buildUser: (input) => input,
  },
};

/**
 * Parses a Markdown response into sections keyed by the `## Heading` text.
 * Used by LiveAgentDemo to render streaming output as cards.
 */
export function parseSections(markdown: string): Array<{ title: string; body: string }> {
  const lines = markdown.split("\n");
  const sections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string } | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1], body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);

  // Trim trailing empty bodies
  return sections.map((s) => ({ title: s.title, body: s.body.trim() }));
}
