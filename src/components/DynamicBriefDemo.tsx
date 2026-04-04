import React, { useState } from "react";
import { Sparkles, FileUp, CheckCircle2, Loader2, Link, Trash2, FileText, ChevronRight, Send, ArrowRight, Plus } from "lucide-react";
import Markdown from "react-markdown";
import { ai } from "../lib/gemini";
import { FieldWithAI } from "./FieldWithAI";
import type { Lang } from "../types";

export function DynamicBriefDemo({ lang }: { lang: Lang }) {
  const [step, setStep] = useState<"setup" | "dialog" | "result">("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup state
  const [theme, setTheme] = useState("Lansering av nytt rådgivningskonsept: 'Fra Strategi til Eksekvering'");
  const [audience, setAudience] = useState("Toppledere (CEO), markedsdirektører (CMO) og ledergrupper i mellomstore til store bedrifter");
  const [goal, setGoal] = useState("Booke 5 strategimøter, posisjonere Ascension som 'no bullshit' eksperter på skjæringspunktet mellom ledelse, merkevare og markedsføring");
  const [channels, setChannels] = useState("LinkedIn (organisk for partnere), Ascension.as (artikkel), direkte e-post til nettverk");
  const [tone, setTone] = useState("No bullshit, direkte, erfaringsbasert, strategisk men pragmatisk. Engasjerende.");
  const [deliverables, setDeliverables] = useState("1 thought leadership-artikkel til nettsiden, 3 LinkedIn-poster for partnerne, 1 e-postmal for outreach");

  // Sources state
  const [sourceNotes, setSourceNotes] = useState("Møtenotater fra forrige uke: Vi må få frem at strategi er verdiløst uten eksekvering. Mange selskaper sliter med siloer mellom HR, drift og marked. Vår filosofi er at ekte vekst skjer når hele organisasjonen er besatt av å dekke kundenes behov. Kommunikasjon er et kritisk verktøy for ledelse. Vi må skille oss fra konsulenter som bare lager fine PowerPoints - vi er praktikere som får ting til å skje.");
  const [sourceFiles, setSourceFiles] = useState<{name: string, content: string}[]>([]);
  const [sourceUrls, setSourceUrls] = useState<string[]>(["https://ascension.as/"]);
  const [newUrl, setNewUrl] = useState("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_EXTENSIONS = [".txt", ".md", ".csv"];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!ALLOWED_EXTENSIONS.includes(ext)) return;
      if (file.size > MAX_FILE_SIZE) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setSourceFiles(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const trimmed = newUrl.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        setSourceUrls(prev => [...prev, trimmed]);
        setNewUrl("");
      }
    } catch {
      // Invalid URL - do nothing
    }
  };

  // Dialog state
  const [chat, setChat] = useState<any>(null);
  const [messages, setMessages] = useState<{role: "user" | "model", text: string}[]>([]);
  const [userInput, setUserInput] = useState("");

  // Result state
  const [finalBrief, setFinalBrief] = useState<string | null>(null);

  const startDialog = async () => {
    setLoading(true);
    setError(null);
    try {
      const filesText = sourceFiles.map(f => `Fil: ${f.name}\nInnhold:\n${f.content}`).join("\n\n");
      const urlsText = sourceUrls.length > 0 ? `Relevante lenker:\n${sourceUrls.join("\n")}` : "";
      const combinedSources = `Notater:\n${sourceNotes}\n\n${filesText}\n\n${urlsText}`;

      const newChat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          tools: [{ urlContext: {} }],
          systemInstruction: `Du er en ekspert på å lage 'Dynamiske Briefer' for innholdsproduksjon.
            Brukeren har oppgitt følgende rammer:
            Tema: ${theme}
            Målgruppe: ${audience}
            Mål: ${goal}
            Kanaler: ${channels}
            Tone: ${tone}
            Ønsket leveranse: ${deliverables}
            Kildemateriale: ${combinedSources}

            Din oppgave er å ha en kort, guidet dialog med brukeren for å kvalitetssikre briefen.
            1. Still ETT konkret, innsiktsfullt spørsmål basert på kildematerialet for å forbedre briefen.
            2. Når brukeren svarer, bruk 'Clarify & Confirm'-mekanismen: Oppsummer hovedpoenget og spør om det er riktig forstått.
            3. Hvis brukeren bekrefter, svar med eksakt teksten "KLAR_FOR_BRIEF" for å signalisere at briefen kan genereres.
            Svar alltid på norsk. Vær kort, presis og profesjonell.`,
        }
      });
      setChat(newChat);

      const response = await newChat.sendMessage({ message: "Hei! Jeg vil gjerne starte brief-prosessen. Kan du stille meg et spørsmål basert på kildematerialet?" });
      setMessages([{ role: "model" as const, text: response.text || "" }]);
      setStep("dialog");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !chat) return;

    const newMessages = [...messages, { role: "user" as const, text: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await chat.sendMessage({ message: userInput });
      const responseText = response.text || "";

      if (responseText.includes("KLAR_FOR_BRIEF")) {
        generateFinalBrief(newMessages);
      } else {
        setMessages([...newMessages, { role: "model" as const, text: responseText }]);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateFinalBrief = async (chatHistory: {role: string, text: string}[]) => {
    setLoading(true);
    setStep("result");
    try {
      const historyText = chatHistory.map(m => `${m.role}: ${m.text}`).join("\n");
      const filesText = sourceFiles.map(f => `Fil: ${f.name}\nInnhold:\n${f.content}`).join("\n\n");
      const urlsText = sourceUrls.length > 0 ? `Relevante lenker:\n${sourceUrls.join("\n")}` : "";
      const combinedSources = `Notater:\n${sourceNotes}\n\n${filesText}\n\n${urlsText}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Du er en ekspert på å skrive ferdige, strukturerte briefer.
          Basert på følgende rammer og dialog, generer en komplett, velformulert brief.

          Rammer:
          Tema: ${theme}
          Målgruppe: ${audience}
          Mål: ${goal}
          Kanaler: ${channels}
          Tone: ${tone}
          Ønsket leveranse: ${deliverables}
          Kildemateriale: ${combinedSources}

          Dialoghistorikk:
          ${historyText}

          Briefen skal inneholde:
          1. Kontekst og Bakgrunn
          2. Målgruppe og Mål
          3. Hovedbudskap (inkludert innsikt fra dialogen)
          4. Kanaler, Tone og Leveranse
          5. Vedlagt Kildemateriale

          Bruk Markdown for formatering. Svar på norsk.`,
        config: {
          tools: [{ urlContext: {} }]
        }
      });
      setFinalBrief(response.text || "");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-6">
      <div className="space-y-space-2">
        <h3 className="font-display text-xl font-medium text-foreground tracking-headline flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-terracotta" />
          {lang === "no" ? "Interaktiv Demo: Dynamisk Brief (V1.0)" : "Interactive Demo: Dynamic Brief (V1.0)"}
        </h3>
        <p className="font-body text-sm text-muted-foreground leading-reading">
          {lang === "no"
            ? "Opplev hvordan AI kan guide deg fra løse tanker til en ferdig, strukturert brief gjennom en 'Clarify & Confirm'-dialog."
            : "Experience how AI can guide you from loose thoughts to a finished, structured brief through a 'Clarify & Confirm' dialog."}
        </p>
      </div>

      {error && (
        <div className="p-space-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm font-body">
          {error}
        </div>
      )}

      {step === "setup" && (
        <div className="grid md:grid-cols-2 gap-space-6">
          <div className="space-y-space-6">
            <div className="space-y-space-4">
              <h4 className="font-display text-lg font-medium text-foreground tracking-headline flex items-center gap-2">
                <FileUp className="w-4 h-4 text-muted-foreground" />
                {lang === "no" ? "1. Kildemateriale" : "1. Source Material"}
              </h4>

              <FieldWithAI
                label={lang === "no" ? "Tema" : "Theme"}
                value={theme}
                onChange={setTheme}
                fieldName="Tema/Theme"
                placeholder={lang === "no" ? "F.eks. Lansering av nytt produkt" : "E.g. Launch of new product"}
                lang={lang}
              />

              <div className="space-y-space-2">
                <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {lang === "no" ? "Lenker & Dokumenter" : "Links & Documents"}
                </label>

                {/* URL Input */}
                <div className="flex gap-2">
                  <input
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddUrl()}
                    placeholder="https://..."
                    className="flex-1 bg-background border border-border rounded-md p-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
                  />
                  <button onClick={handleAddUrl} className="bg-secondary text-secondary-foreground px-3 rounded-md hover:bg-secondary/80 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* File Input */}
                <div>
                  <input type="file" multiple accept=".txt,.md,.csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-2 text-sm text-terracotta hover:underline font-medium">
                    <FileUp className="w-4 h-4"/>
                    {lang === "no" ? "Last opp dokumenter (.txt, .md, .csv)" : "Upload documents (.txt, .md, .csv)"}
                  </label>
                </div>

                {/* Source Lists */}
                {(sourceUrls.length > 0 || sourceFiles.length > 0) && (
                  <div className="bg-background border border-border rounded-md p-3 space-y-2 mt-2">
                    {sourceUrls.map((url, i) => (
                      <div key={`url-${i}`} className="flex items-center justify-between text-sm bg-card p-2 rounded border border-border">
                        <div className="flex items-center gap-2 truncate">
                          <Link className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-muted-foreground">{url}</span>
                        </div>
                        <button onClick={() => setSourceUrls(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-500 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {sourceFiles.map((file, i) => (
                      <div key={`file-${i}`} className="flex items-center justify-between text-sm bg-card p-2 rounded border border-border">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate text-muted-foreground">{file.name}</span>
                        </div>
                        <button onClick={() => setSourceFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-500 shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <FieldWithAI
                label={lang === "no" ? "Rånotater" : "Raw Notes"}
                value={sourceNotes}
                onChange={setSourceNotes}
                fieldName="Rånotater/Raw Notes"
                placeholder={lang === "no" ? "Lim inn løse tanker, møtenotater eller utkast her..." : "Paste loose thoughts, meeting notes or drafts here..."}
                lang={lang}
              />
            </div>
          </div>

          <div className="space-y-space-4">
            <h4 className="font-display text-lg font-medium text-foreground tracking-headline flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              {lang === "no" ? "2. Definer Rammer" : "2. Define Framework"}
            </h4>

            <FieldWithAI
              label={lang === "no" ? "Målgruppe" : "Audience"}
              value={audience}
              onChange={setAudience}
              fieldName="Målgruppe/Audience"
              placeholder={lang === "no" ? "Hvem snakker vi til?" : "Who are we talking to?"}
              lang={lang}
            />

            <FieldWithAI
              label={lang === "no" ? "Mål" : "Goal"}
              value={goal}
              onChange={setGoal}
              fieldName="Mål/Goal"
              placeholder={lang === "no" ? "Hva skal vi oppnå?" : "What do we want to achieve?"}
              lang={lang}
            />

            <div className="grid grid-cols-2 gap-space-4">
              <FieldWithAI
                label={lang === "no" ? "Kanaler" : "Channels"}
                value={channels}
                onChange={setChannels}
                fieldName="Kanaler/Channels"
                placeholder={lang === "no" ? "Hvor skal det publiseres?" : "Where will it be published?"}
                lang={lang}
              />
              <FieldWithAI
                label={lang === "no" ? "Tone" : "Tone"}
                value={tone}
                onChange={setTone}
                fieldName="Tone/Tone"
                placeholder={lang === "no" ? "Hvordan skal vi høres ut?" : "How should we sound?"}
                lang={lang}
              />
            </div>

            <FieldWithAI
              label={lang === "no" ? "Ønsket Leveranse" : "Deliverables"}
              value={deliverables}
              onChange={setDeliverables}
              fieldName="Ønsket Leveranse/Deliverables"
              placeholder={lang === "no" ? "Hva skal produseres?" : "What should be produced?"}
              lang={lang}
            />
          </div>

          <div className="md:col-span-2 pt-space-4 flex justify-end">
            <button
              onClick={startDialog}
              disabled={loading}
              className="bg-terracotta text-terracotta-foreground px-space-6 py-space-3 rounded-full font-body text-sm font-medium transition-colors hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {lang === "no" ? "Start Guidet Dialog" : "Start Guided Dialog"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === "dialog" && (
        <div className="space-y-space-4">
          <div className="bg-background border border-border rounded-lg p-space-4 h-96 overflow-y-auto space-y-space-4 flex flex-col">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-space-3 font-body text-sm leading-reading ${msg.role === "user" ? "bg-terracotta text-terracotta-foreground" : "bg-card border border-border text-foreground"}`}>
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-lg p-space-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="font-body text-sm text-muted-foreground">AI tenker...</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-space-2">
            <input
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={lang === "no" ? "Svar AI-en her..." : "Reply to AI here..."}
              className="flex-1 bg-background border border-border rounded-full px-space-4 py-space-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !userInput.trim()}
              className="bg-terracotta text-terracotta-foreground p-space-2 rounded-full transition-colors hover:bg-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-end pt-space-2">
            <button
              onClick={() => generateFinalBrief(messages)}
              disabled={loading}
              className="text-terracotta font-body text-sm font-medium hover:underline flex items-center gap-1"
            >
              {lang === "no" ? "Hopp over og generer brief" : "Skip and generate brief"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-space-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-space-12 space-y-space-4">
              <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
              <p className="font-body text-muted-foreground">Genererer ferdig brief...</p>
            </div>
          ) : (
            <>
              <div className="bg-background border border-border rounded-lg p-space-6 prose prose-sm prose-p:leading-reading prose-headings:font-display prose-headings:tracking-headline prose-a:text-terracotta max-w-none font-body text-foreground">
                <Markdown>{finalBrief || ""}</Markdown>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setStep("setup");
                    setMessages([]);
                    setFinalBrief(null);
                    setChat(null);
                  }}
                  className="bg-card border border-border text-foreground px-space-6 py-space-3 rounded-full font-body text-sm font-medium transition-colors hover:bg-background flex items-center gap-2"
                >
                  {lang === "no" ? "Start på nytt" : "Start over"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
