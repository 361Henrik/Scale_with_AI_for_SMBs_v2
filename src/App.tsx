import React, { useMemo, useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, MessageSquare, X, Mic, Square, Send, Zap, Brain, Sparkles, Wrench, UserPlus, Network, BookOpen, Loader2, FileText, Link, Check, ChevronRight, FileUp, Plus, Trash2, Users, Sliders, Settings, BarChart2, MessageCircle, Rss, Monitor, Briefcase, ChevronDown } from "lucide-react";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  role: 'user' | 'model';
  text: string;
};

type Mode = 'standard' | 'fast' | 'think';

function AIAssistant({ lang }: { lang: "no" | "en" }) {
  const [isOpen, setIsOpen] = useState(false);
  const initialMessage = lang === "no" 
    ? "Hei! Jeg er Employees 361-assistenten. Hva kan jeg hjelpe deg med i dag?"
    : "Hi! I am the Employees 361 assistant. How can I help you today?";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: initialMessage }
  ]);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'model') {
        return [{ role: 'model', text: initialMessage }];
      }
      return prev;
    });
  }, [initialMessage]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('standard');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      let modelName = 'gemini-3.1-pro-preview';
      let config: any = {};

      if (mode === 'fast') {
        modelName = 'gemini-3.1-flash-lite-preview';
      } else if (mode === 'think') {
        modelName = 'gemini-3.1-pro-preview';
        config = { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } };
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: userText,
        config
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Beklager, det oppstod en feil.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          await transcribeAudio(base64data, 'audio/webm');
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Kunne ikke få tilgang til mikrofonen. Sjekk tillatelser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: mimeType
              }
            },
            { text: "Please transcribe this audio accurately in the language spoken." }
          ]
        }
      });
      
      const transcribedText = response.text || '';
      if (transcribedText) {
        setInput(prev => prev + (prev ? ' ' : '') + transcribedText.trim());
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Klarte ikke å transkribere lyden.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-space-6 right-space-6 h-[56px] w-[56px] rounded-full bg-terracotta text-terracotta-foreground flex items-center justify-center shadow-md hover:opacity-90 transition-opacity z-50"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-space-6 right-space-6 w-[380px] h-[600px] max-h-[80vh] bg-background border border-border rounded-lg shadow-lg flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-space-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-display text-lg font-medium tracking-headline">Employees 361</h3>
              <p className="font-body text-xs opacity-80">{lang === "no" ? "Din tenkepartner" : "Your thinking partner"}</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="bg-card border-b border-border p-space-2 flex gap-space-2 shrink-0">
            <button
              onClick={() => setMode('standard')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[36px] rounded-full font-body text-xs font-medium transition-colors ${
                mode === 'standard' ? 'bg-terracotta text-terracotta-foreground' : 'text-foreground hover:bg-border'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Standard
            </button>
            <button
              onClick={() => setMode('fast')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[36px] rounded-full font-body text-xs font-medium transition-colors ${
                mode === 'fast' ? 'bg-terracotta text-terracotta-foreground' : 'text-foreground hover:bg-border'
              }`}
            >
              <Zap className="h-3.5 w-3.5" /> Rask
            </button>
            <button
              onClick={() => setMode('think')}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[36px] rounded-full font-body text-xs font-medium transition-colors ${
                mode === 'think' ? 'bg-terracotta text-terracotta-foreground' : 'text-foreground hover:bg-border'
              }`}
            >
              <Brain className="h-3.5 w-3.5" /> Dyp
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-space-4 space-y-space-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-lg p-space-3 font-body text-sm leading-reading ${
                    msg.role === 'user' 
                      ? 'bg-card border border-border text-foreground' 
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg p-space-3 bg-primary text-primary-foreground font-body text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-space-4 bg-card border-t border-border shrink-0">
            <div className="flex gap-space-2">
              <div className="relative flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Skriv en melding..."
                  className="w-full bg-background border border-border rounded-lg pl-space-3 pr-10 py-space-2 font-body text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-[44px]"
                  rows={1}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`absolute right-1 top-1 h-[36px] w-[36px] flex items-center justify-center rounded-md transition-colors ${
                    isRecording ? 'text-terracotta animate-pulse' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-[44px] w-[44px] shrink-0 bg-terracotta text-terracotta-foreground rounded-lg flex items-center justify-center disabled:opacity-50 transition-opacity"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AgentBuilder({ lang }: { lang: "no" | "en" }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{
    name: string;
    description: string;
    baseSkills: string[];
    mode: 'Autonom' | 'Ko-pilot' | 'Orkestrert';
  } | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Agent Finder State
  const [agentFinderInput, setAgentFinderInput] = useState("");
  const [isFindingAgent, setIsFindingAgent] = useState(false);
  const [agentFinderResult, setAgentFinderResult] = useState<any>(null);
  const [agentFinderError, setAgentFinderError] = useState(false);

  // Agent Description State
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [agentDescription, setAgentDescription] = useState<string | null>(null);
  const [agentDescriptionError, setAgentDescriptionError] = useState(false);

  // Image Generation State
  const [agentImage, setAgentImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // QA State
  const [qaInput, setQaInput] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [qaResult, setQaResult] = useState<string | null>(null);
  const [qaError, setQaError] = useState(false);

  const steps = [
    { no: "Velg kategori", en: "Choose category" },
    { no: "Velg agenttype", en: "Choose agent type" },
    { no: "Legg til ferdigheter", en: "Add skills" },
    { no: "Din agent er klar", en: "Your agent is ready" },
  ];

  const agentsByCategory: Record<string, any[]> = {
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

  const categories = [
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

  const skillSuggestions: Record<string, string> = {
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

  const skillGroups = [
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

  useEffect(() => {
    if (stepIndex === 2 && selectedAgent) {
      setSelectedSkills(selectedAgent.baseSkills);
    }
  }, [stepIndex, selectedAgent]);

  useEffect(() => {
    if (stepIndex === 3 && selectedAgent) {
      Promise.all([
        generateAgentDescription(),
        generateAgentImage()
      ]);
    }
  }, [stepIndex]);

  const buildImagenPrompt = (
    category: string,
    agentName: string,
    skills: string[]
  ): string => {
    const categoryScenes: Record<string, string> = {
      "Drift og operasjoner": "a calm Nordic office, morning light, organised workspace, someone reviewing a clean dashboard on a laptop",
      "Økonomi og administrasjon": "a quiet Scandinavian office, financial documents neatly arranged, a professional working with focused attention",
      "HR og personal": "a bright open-plan Nordic workspace, two professionals in a relaxed conversation, onboarding materials on a desk",
      "Kundeservice og salg": "a modern Nordic workspace, a professional writing a thoughtful response, warm ambient light, clean desk",
      "Marked og innhold": "a creative Nordic studio space, editorial mood, someone reviewing content on a screen, plants and natural light",
      "IT og systemer": "a clean modern server room or tech workspace, organised cables and screens, Scandinavian minimalism",
      "Lederstøtte": "a panoramic Nordic office with city view, a leader reviewing documents at a standing desk, morning light"
    };

    const scene = categoryScenes[category] || "a calm Nordic professional office environment, Scandinavian minimalism";

    return `Editorial photography style. ${scene}. Muted color palette with cream whites, deep forest greens and warm terracotta accents. Soft natural window light. No visible technology logos. No text in image. Photorealistic but with editorial calmness. 16:9 composition. Premium Scandinavian aesthetic. No people's faces visible. Depth of field. Professional quality.`;
  };

  const generateAgentImage = async () => {
    if (!selectedAgent || !selectedCategory) return;
    
    setImageLoading(true);
    setAgentImage(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const categoryName = categories.find(c => c.id === selectedCategory)?.no.title || "";
      
      const prompt = buildImagenPrompt(
        categoryName,
        selectedAgent.name,
        selectedSkills
      );
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });
      
      let imageData = null;
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }
      
      if (imageData) {
        setAgentImage(`data:image/png;base64,${imageData}`);
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      setAgentImage(null);
    } finally {
      setImageLoading(false);
    }
  };

  const handleFindAgent = async () => {
    if (!agentFinderInput.trim()) return;
    setIsFindingAgent(true);
    setAgentFinderError(false);
    setAgentFinderResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const allAgentsList = Object.entries(agentsByCategory).flatMap(([category, agents]) => 
        agents.map(a => `${a.name.no} (${category}): ${a.description.no}`)
      ).join("\\n");

      const agentFinderPrompt = `
Du er en AI-rådgiver for norske SMB-er. En bruker har beskrevet hva de trenger hjelp med.

Tilgjengelige agenttyper på tvers av alle kategorier:
${allAgentsList}

Brukerens beskrivelse: "${agentFinderInput}"

Returner KUN et JSON-objekt med denne strukturen:
{
  "bestMatch": {
    "name": "agentnavnet",
    "category": "kategorinavnet",
    "reason": "En setning på norsk som forklarer hvorfor denne passer",
    "suggestedSkills": ["ferdighetsnavn1", "ferdighetsnavn2", "ferdighetsnavn3"]
  },
  "alternativeMatch": {
    "name": "agentnavnet",
    "category": "kategorinavnet",
    "reason": "En setning på norsk"
  }
}
Ingen annen tekst. Kun JSON.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: agentFinderPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAgentFinderResult(result);
    } catch (error) {
      console.error("Agent finder error:", error);
      setAgentFinderError(true);
    } finally {
      setIsFindingAgent(false);
    }
  };

  const generateAgentDescription = async () => {
    if (!selectedAgent) return;
    
    setIsGeneratingDescription(true);
    setAgentDescriptionError(false);
    setAgentDescription(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const categoryName = categories.find(c => c.id === selectedCategory)?.[lang].title || "";
      
      const agentDescriptionPrompt = `
Du er en AI-rådgiver som skriver klare, konkrete beskrivelser for norske SMB-ledere.

Agent som er konfigurert:
- Navn: ${selectedAgent.name}
- Kategori: ${categoryName}
- Kontrollmodus: ${selectedAgent.mode}
- Valgte ferdigheter: ${selectedSkills.join(', ')}

Skriv en konkret beskrivelse på 3-4 setninger av hva denne agenten faktisk
kan gjøre for en norsk SMB med disse ferdighetene. Vær spesifikk — bruk
eksempler på faktiske oppgaver den vil utføre. Unngå generisk AI-språk.
Skriv i andre person ("Denne agenten..."). Svar på norsk.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: agentDescriptionPrompt,
      });

      setAgentDescription(response.text || "");
    } catch (error) {
      console.error("Agent description error:", error);
      setAgentDescriptionError(true);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!qaInput.trim() || !selectedAgent) return;
    
    setIsAskingQuestion(true);
    setQaError(false);
    setQaResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const categoryName = categories.find(c => c.id === selectedCategory)?.[lang].title || "";
      
      const agentQAPrompt = `
Du er en ekspert på AI-implementering for norske SMB-er.
Kontekst: Brukeren har konfigurert følgende agent:
- Navn: ${selectedAgent.name}, Kategori: ${categoryName}
- Ferdigheter: ${selectedSkills.join(', ')}
- Kontrollmodus: ${selectedAgent.mode}

Spørsmål: "${qaInput}"

Svar konsist (maks 3 setninger), praktisk og på norsk. Unngå teknisk jargong.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: agentQAPrompt,
      });

      setQaResult(response.text || "");
    } catch (error) {
      console.error("QA error:", error);
      setQaError(true);
    } finally {
      setIsAskingQuestion(false);
    }
  };

  const handleSelectFoundAgent = (match: any) => {
    const categoryAgents = agentsByCategory[match.category];
    if (categoryAgents) {
      const agent = categoryAgents.find(a => a.name.no === match.name);
      if (agent) {
        const cat = categories.find(c => c.no.title === match.category);
        if (cat) {
          setSelectedCategory(cat.id);
        }
        setSelectedAgent({
          name: agent.name[lang],
          description: agent.description[lang],
          baseSkills: agent.baseSkills[lang],
          mode: agent.mode
        });
        setSelectedSkills(match.suggestedSkills || agent.baseSkills[lang]);
        setStepIndex(2);
      }
    }
  };

  return (
    <div className="w-full">
      {/* 1. STEP INDICATOR */}
      <div className="flex w-full border-t border-border mb-space-6">
        {steps.map((step, index) => {
          const isActive = index === stepIndex;
          const isCompleted = index < stepIndex;
          
          return (
            <div 
              key={index}
              onClick={() => isCompleted ? setStepIndex(index) : undefined}
              className={`flex-1 flex items-center justify-center min-h-[44px] ${
                isCompleted ? 'cursor-pointer' : 'cursor-default'
              } ${
                isActive 
                  ? 'text-terracotta border-b-2 border-terracotta' 
                  : 'text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCompleted && <CheckCircle2 className="w-[14px] h-[14px]" />}
                <span className="font-body text-sm">{step[lang]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. HUMAN-IN-THE-LOOP PANEL */}
      <div className="bg-card border border-border rounded-lg p-space-5 mb-space-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="flex flex-col gap-2">
            <Zap className="w-6 h-6 text-terracotta" />
            <h3 className="font-display font-medium text-[16px] text-foreground">
              {lang === "no" ? "Autonom" : "Autonomous"}
            </h3>
            <p className="font-body text-[13px] text-muted-foreground leading-relaxed">
              {lang === "no" 
                ? "Agenten handler og rapporterer. Du vurderer resultater, ikke enkelthandlinger. Best for veldefinerte, repeterbare oppgaver." 
                : "The agent acts and reports. You evaluate results, not individual actions. Best for well-defined, repeatable tasks."}
            </p>
          </div>
          
          {/* Column 2 */}
          <div className="flex flex-col gap-2">
            <Users className="w-6 h-6 text-terracotta" />
            <h3 className="font-display font-medium text-[16px] text-foreground">
              {lang === "no" ? "Ko-pilot" : "Co-pilot"}
            </h3>
            <p className="font-body text-[13px] text-muted-foreground leading-relaxed">
              {lang === "no" 
                ? "Agenten foreslår, du godkjenner. Hver viktig handling krever en menneskelig avgjørelse. Best når kontekst og vurdering varierer." 
                : "The agent suggests, you approve. Every important action requires a human decision. Best when context and judgment vary."}
            </p>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-2">
            <Sliders className="w-6 h-6 text-terracotta" />
            <h3 className="font-display font-medium text-[16px] text-foreground">
              {lang === "no" ? "Orkestrert" : "Orchestrated"}
            </h3>
            <p className="font-body text-[13px] text-muted-foreground leading-relaxed">
              {lang === "no" 
                ? "Du leder. Agenten utfører oppgavene du tildeler. Full kontroll til enhver tid. Best i sensitive eller komplekse situasjoner." 
                : "You lead. The agent executes the tasks you assign. Full control at all times. Best in sensitive or complex situations."}
            </p>
          </div>
        </div>
        
        <p className="mt-4 font-body text-[13px] text-muted-foreground">
          {lang === "no" 
            ? "Alle agenter kan konfigureres til ethvert kontrollnivå og nedgraderes når som helst. Du bestemmer alltid graden av autonomi." 
            : "All agents can be configured to any control level and downgraded at any time. You always decide the level of autonomy."}
        </p>
      </div>

      {/* 3. STEP CONTENT */}
      {stepIndex === 0 && (
        <div className="mt-space-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-space-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`border rounded-lg p-space-5 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-card border-border hover:border-primary'
                  }`}
                >
                  <Icon 
                    className={`w-6 h-6 mb-3 ${
                      isSelected ? 'text-accent' : 'text-terracotta'
                    }`} 
                  />
                  <h4 className="font-display font-medium text-[16px] mb-1">
                    {cat[lang].title}
                  </h4>
                  <p className={`font-body text-[13px] ${
                    isSelected ? 'opacity-80' : 'text-muted-foreground'
                  }`}>
                    {cat[lang].desc}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-space-6 flex justify-end">
            <button
              onClick={() => setStepIndex(1)}
              disabled={!selectedCategory}
              className={`group bg-terracotta text-white h-[44px] px-space-6 rounded-full font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                !selectedCategory ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {lang === "no" ? "Gå videre" : "Continue"}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* 4. STEP 2 CONTENT */}
      {stepIndex === 1 && (
        <div className="mt-space-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
            {selectedCategory && categories.find(c => c.id === selectedCategory) && 
              agentsByCategory[categories.find(c => c.id === selectedCategory)!.no.title]?.map((agent, idx) => {
                const isSelected = selectedAgent?.name === agent.name[lang];
                
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedAgent({
                      name: agent.name[lang],
                      description: agent.description[lang],
                      baseSkills: agent.baseSkills[lang],
                      mode: agent.mode
                    })}
                    className={`border rounded-lg p-space-5 cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-card border-border hover:border-terracotta/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-display font-medium text-[16px]">
                        {agent.name[lang]}
                      </h4>
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        agent.mode === 'Autonom' 
                          ? 'bg-accent text-[#1A1F1A]' 
                          : agent.mode === 'Ko-pilot'
                            ? isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-foreground'
                      }`}>
                        {agent.mode}
                      </span>
                    </div>
                    <p className={`font-body text-[13px] ${
                      isSelected ? 'opacity-80' : 'text-muted-foreground'
                    }`}>
                      {agent.description[lang]}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-space-3">
                      {agent.baseSkills[lang].map((skill: string, sIdx: number) => (
                        <span 
                          key={sIdx}
                          className={`border rounded-full px-3 py-1 text-xs ${
                            isSelected 
                              ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground' 
                              : 'bg-background border-border'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
            })}
          </div>

          {/* "FINNER DU IKKE DET DU SER ETTER?" SECTION */}
          <div className="bg-background border border-dashed border-border rounded-lg p-space-5 mt-space-4">
            <h4 className="font-body font-medium text-[14px] text-foreground mb-3">
              {lang === "no" ? "Finner du ikke det du ser etter?" : "Don't see what you need?"}
            </h4>
            <textarea
              value={agentFinderInput}
              onChange={(e) => setAgentFinderInput(e.target.value)}
              className="min-h-[80px] w-full bg-background border border-border rounded-lg p-space-3 font-body text-sm resize-none focus:outline-none focus:border-primary"
              placeholder={lang === "no" ? "Beskriv hva du trenger hjelp med..." : "Describe what you need help with..."}
            />
            <div className="mt-3">
              <button 
                onClick={handleFindAgent}
                disabled={isFindingAgent || !agentFinderInput.trim()}
                className="bg-terracotta text-white h-[44px] px-space-5 rounded-lg font-body text-sm font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFindingAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "no" ? "Finn agent" : "Find agent")}
              </button>
            </div>
            
            {agentFinderError && (
              <div className="mt-space-4 bg-red-500/10 border border-red-500/20 rounded-lg p-space-3 text-sm text-red-500">
                {lang === "no" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again."}
              </div>
            )}
            
            {agentFinderResult && agentFinderResult.bestMatch && (
              <div className="mt-space-4 bg-card border border-border rounded-lg p-space-5">
                <div className="mb-space-4">
                  <span className="text-muted-foreground uppercase text-[12px] font-medium tracking-wider">
                    {lang === "no" ? "Beste treff:" : "Best match:"}
                  </span>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <h4 className="font-display font-medium text-[16px]">{agentFinderResult.bestMatch.name}</h4>
                    <span className="bg-primary-foreground/10 text-primary-foreground rounded-full px-2 py-0.5 text-[10px]">
                      {agentFinderResult.bestMatch.category}
                    </span>
                  </div>
                  <p className="font-body text-sm text-foreground">
                    {agentFinderResult.bestMatch.reason}
                  </p>
                  <button 
                    onClick={() => handleSelectFoundAgent(agentFinderResult.bestMatch)}
                    className="mt-3 bg-terracotta text-white h-[36px] px-4 rounded-lg font-body text-sm font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                  >
                    {lang === "no" ? "Velg denne agenten" : "Select this agent"}
                  </button>
                </div>
                
                {agentFinderResult.alternativeMatch && (
                  <div className="pt-space-4 border-t border-border">
                    <span className="text-muted-foreground uppercase text-[12px] font-medium tracking-wider">
                      {lang === "no" ? "Alternativt:" : "Alternative:"}
                    </span>
                    <div className="flex items-center gap-2 mt-1 mb-1">
                      <h4 className="font-display font-medium text-[14px] text-muted-foreground">{agentFinderResult.alternativeMatch.name}</h4>
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px]">
                        {agentFinderResult.alternativeMatch.category}
                      </span>
                    </div>
                    <p className="font-body text-[13px] text-muted-foreground">
                      {agentFinderResult.alternativeMatch.reason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between items-center mt-space-6">
            <button
              onClick={() => {
                setStepIndex(0);
                setSelectedAgent(null);
              }}
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              {lang === "no" ? "Tilbake" : "Back"}
            </button>
            <button
              onClick={() => setStepIndex(2)}
              disabled={!selectedAgent}
              className={`group bg-terracotta text-white h-[44px] px-space-6 rounded-full font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                !selectedAgent ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {lang === "no" ? "Gå videre" : "Continue"}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* 5. STEP 3 CONTENT */}
      {stepIndex === 2 && (
        <div className="mt-space-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-5">
            {/* LEFT PANEL */}
            <div className="bg-card border border-border rounded-lg p-space-5">
              <h3 className="font-display font-medium text-[18px]">
                {lang === "no" ? "Valgte ferdigheter" : "Selected skills"}
              </h3>
              
              {selectedSkills.length === 0 ? (
                <p className="font-body text-sm italic text-muted-foreground mt-space-3">
                  {lang === "no" ? "Ingen ferdigheter valgt ennå" : "No skills selected yet"}
                </p>
              ) : (
                <div className="flex flex-wrap gap-space-2 mt-space-3">
                  {selectedSkills.map((skill, idx) => (
                    <span key={idx} className="bg-background border border-terracotta text-terracotta rounded-full px-3 py-1 text-xs flex items-center gap-1">
                      {skill}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))} 
                      />
                    </span>
                  ))}
                </div>
              )}

              {/* SUGGESTION PILL */}
              {(() => {
                const suggestion = selectedSkills.map(s => skillSuggestions[s]).find(s => s && !selectedSkills.includes(s));
                if (suggestion) {
                  return (
                    <div className="mt-space-4">
                      <span 
                        onClick={() => setSelectedSkills(prev => [...prev, suggestion])}
                        className="inline-flex items-center bg-background border border-dashed border-border rounded-full px-3 py-1 text-xs text-muted-foreground cursor-pointer hover:border-primary hover:text-foreground transition-colors"
                      >
                        {lang === "no" ? "Kombineres gjerne med: " : "Pairs well with: "}
                        {suggestion}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* RIGHT PANEL */}
            <div className="bg-card border border-border rounded-lg p-space-5">
              {skillGroups.map((group, gIdx) => (
                <div key={gIdx} className="mt-space-4 first:mt-0">
                  <h4 className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground mb-space-2">
                    {group[lang]}
                  </h4>
                  <div className="flex flex-wrap gap-space-2">
                    {group.skills[lang].map((skill, sIdx) => {
                      const isSelected = selectedSkills.includes(skill);
                      return (
                        <button
                          key={sIdx}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSkills(prev => prev.filter(s => s !== skill));
                            } else {
                              setSelectedSkills(prev => [...prev, skill]);
                            }
                          }}
                          className={`rounded-full px-3 py-1 text-xs transition-all duration-200 active:scale-[0.98] ${
                            isSelected 
                              ? 'bg-terracotta text-terracotta-foreground border border-terracotta' 
                              : 'bg-background border border-border text-foreground hover:border-terracotta/50'
                          }`}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between items-center mt-space-6">
            <button
              onClick={() => setStepIndex(1)}
              className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body text-sm"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              {lang === "no" ? "Tilbake" : "Back"}
            </button>
            <button
              onClick={() => setStepIndex(3)}
              disabled={selectedSkills.length === 0}
              className={`group bg-terracotta text-white h-[44px] px-space-6 rounded-full font-body text-sm font-medium transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                selectedSkills.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {lang === "no" ? "Gå videre" : "Continue"}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      )}

      {/* 6. STEP 4 CONTENT */}
      {stepIndex === 3 && selectedAgent && (
        <div className="mt-space-4">
          {/* TOP SECTION */}
          <div className="bg-primary text-primary-foreground rounded-lg p-space-6">
            <h2 className="font-display text-3xl font-medium text-primary-foreground">
              {selectedAgent.name}
            </h2>
            <div className="inline-block bg-primary-foreground/15 text-primary-foreground rounded-full px-3 py-1 text-xs mt-space-2">
              {selectedCategory && categories.find(c => c.id === selectedCategory)?.[lang].title}
            </div>
            
            <div className="mt-space-4">
              <span className="font-body text-sm font-medium">{selectedAgent.mode}: </span>
              <span className="font-body text-sm opacity-90">
                {selectedAgent.mode === 'Autonom' 
                  ? (lang === "no" ? "Agenten handler selvstendig og rapporterer. Du vurderer resultater." : "The agent acts independently and reports. You review outcomes.")
                  : selectedAgent.mode === 'Ko-pilot'
                    ? (lang === "no" ? "Agenten foreslår, du godkjenner. Hver viktig handling får menneskelig sjekk." : "The agent proposes, you approve. Every key action gets a human check.")
                    : (lang === "no" ? "Du leder. Agenten utfører oppgavene du tildeler. Full kontroll." : "You lead. The agent executes the tasks you assign. Full control.")}
              </span>
            </div>

            {/* IMAGE PLACEHOLDER */}
            <div className="mt-space-5 w-full rounded-lg bg-card border border-border flex items-center justify-center group overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {imageLoading ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <span className="font-body text-[13px]">
                    {lang === "no" ? "Genererer visuell..." : "Generating visual..."}
                  </span>
                </div>
              ) : agentImage ? (
                <img
                  src={agentImage}
                  alt={selectedAgent.name}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
              ) : (
                <span className="font-body text-sm text-muted-foreground">
                  {/* Empty state if failed */}
                </span>
              )}
            </div>
            {agentImage && !imageLoading && (
              <div className="mt-2 text-right">
                <span className="font-body text-[12px] text-muted-foreground">
                  {lang === "no" ? "Illustrasjon generert av Imagen 3" : "Illustration generated by Imagen 3"}
                </span>
              </div>
            )}
          </div>

          {/* MIDDLE SECTION */}
          <div className="bg-card border border-border rounded-lg p-space-6 mt-space-5">
            <h3 className="font-display font-medium text-[18px] mb-space-3">
              {lang === "no" ? "Valgte ferdigheter" : "Selected skills"}
            </h3>
            <div className="flex flex-wrap gap-space-2">
              {selectedSkills.map((skill, idx) => (
                <span key={idx} className="bg-background border border-terracotta text-terracotta rounded-full px-3 py-1 text-xs">
                  {skill}
                </span>
              ))}
            </div>

            <h3 className="font-display font-medium text-[18px] mt-space-4 mb-space-3">
              {lang === "no" ? "Hva denne agenten kan gjøre" : "What this agent can do"}
            </h3>
            <div id="agent-description-target">
              {agentDescriptionError ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-space-3 text-sm text-red-500">
                  {lang === "no" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again."}
                </div>
              ) : isGeneratingDescription ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="font-body text-sm italic">
                    {lang === "no" ? "Genererer beskrivelse av agentens kapasitet..." : "Generating description of agent capabilities..."}
                  </p>
                </div>
              ) : agentDescription ? (
                <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {agentDescription}
                </p>
              ) : (
                <p className="font-body text-sm italic text-muted-foreground">
                  {lang === "no" ? "Genererer beskrivelse av agentens kapasitet..." : "Generating description of agent capabilities..."}
                </p>
              )}
            </div>

            {/* QA SECTION */}
            <div className="mt-space-5 pt-space-5 border-t border-border">
              <label className="block font-body text-[13px] text-muted-foreground mb-2">
                {lang === "no" ? "Spør om ferdigheter, integrasjoner eller implementering" : "Ask about skills, integrations or implementation"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qaInput}
                  onChange={(e) => setQaInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                  placeholder={lang === "no" ? "Still et spørsmål om denne agenten..." : "Ask a question about this agent..."}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 font-body text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleAskQuestion}
                  disabled={isAskingQuestion || !qaInput.trim()}
                  className="bg-terracotta text-white px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 active:scale-[0.98]"
                >
                  {isAskingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {qaError && (
                <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-space-3 text-sm text-red-500">
                  {lang === "no" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again."}
                </div>
              )}

              {qaResult && (
                <div className="mt-3 bg-muted/50 border border-border rounded-lg p-space-4">
                  <p className="font-body text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {qaResult}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="bg-background border border-border rounded-lg p-space-6 mt-space-5">
            <h3 className="font-display font-medium text-[18px] mb-space-3">
              {lang === "no" ? "Hva agenten fortsatt trenger" : "What the agent still needs"}
            </h3>
            <p className="font-body text-sm text-foreground leading-relaxed">
              {lang === "no" 
                ? "Denne agenten er klar som et skjelett. Koble den til din arbeidsflate — e-post, CRM, regneark eller andre systemer du bruker — og gi den kontekst fra din virksomhet. Da er den operativ." 
                : "This agent is ready as a scaffold. Connect it to your workspace — email, CRM, spreadsheets or other systems you use — and give it context from your business. Then it is operational."}
            </p>

            {/* CTA BUTTON */}
            <button 
              onClick={() => window.location.href = "mailto:hei@the361.ai"}
              className="mt-space-5 w-full h-[48px] bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 transition-all duration-200 active:scale-[0.98] flex items-center justify-center"
            >
              {lang === "no" ? "Book en introduksjon med ThreeSixtyOne" : "Book an intro with ThreeSixtyOne"}
            </button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStepIndex(2)}
                className="group text-muted-foreground hover:text-foreground transition-colors font-body text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                {lang === "no" ? "Tilbake" : "Back"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSection({ lang, setLang, setMainTab }: { lang: "no" | "en", setLang: (l: "no" | "en") => void, setMainTab: (t: "roles" | "perspective" | "builder") => void }) {
  const scrollToApp = () => {
    const appMain = document.getElementById("app-main");
    if (appMain) {
      appMain.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSecondaryClick = () => {
    setMainTab("builder");
    scrollToApp();
  };

  return (
    <section className="relative min-h-screen bg-primary w-full flex flex-col justify-center px-space-6 py-space-12 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto lg:grid lg:grid-cols-[1.3fr_0.7fr] lg:gap-space-8 flex flex-col gap-space-6">
        {/* LEFT COLUMN */}
        <div 
          className="flex flex-col"
        >
          <div className="flex justify-between items-start mb-space-12">
            <div className="bg-white/10 border border-white/20 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setLang("no")}
                className={`rounded-md px-3 min-h-[36px] font-body text-sm font-medium transition-colors ${
                  lang === "no"
                    ? "bg-accent text-foreground"
                    : "text-primary-foreground/80 hover:bg-white/10"
                }`}
              >
                NO
              </button>
              <button
                onClick={() => setLang("en")}
                className={`rounded-md px-3 min-h-[36px] font-body text-sm font-medium transition-colors ${
                  lang === "en"
                    ? "bg-accent text-foreground"
                    : "text-primary-foreground/80 hover:bg-white/10"
                }`}
              >
                EN
              </button>
            </div>
            <div className="font-body text-xs uppercase tracking-widest text-accent text-right">
              ThreeSixtyOne · Employees 361
            </div>
          </div>

          <h1 className="font-display font-bold leading-[1.05] text-primary-foreground text-5xl md:text-6xl lg:text-7xl whitespace-pre-line">
            {lang === "no" 
              ? "Ti ansatte.\nKapasiteten til tjuefem." 
              : "Ten employees.\nThe capacity of twenty-five."}
          </h1>

          <p className="font-body text-lg md:text-xl text-primary-foreground/80 leading-relaxed max-w-[48ch] mt-space-5">
            {lang === "no"
              ? "Employees 361 gir norske SMB-er tilgang til AI-støttede medarbeidere som tar arbeidet rundt menneskene — ikke jobben til menneskene."
              : "Employees 361 gives Nordic SMBs access to AI-supported team members that handle the work around people — not the work of people."}
          </p>

          <div className="mt-space-8 flex gap-space-4 flex-wrap">
            <button 
              onClick={scrollToApp}
              className="bg-accent text-foreground rounded-lg h-[48px] px-space-7 font-body font-medium text-base hover:opacity-90 transition-opacity"
            >
              {lang === "no" ? "Se hvilke roller som passer deg" : "See which roles fit your business"}
            </button>
            <button 
              onClick={handleSecondaryClick}
              className="border border-primary-foreground/30 text-primary-foreground rounded-lg h-[48px] px-space-7 font-body font-medium text-base hover:bg-white/5 transition-colors"
            >
              {lang === "no" ? "Bygg ditt første AI-teammedlem" : "Build your first AI team member"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div 
          className="flex flex-col gap-space-4 justify-center"
        >
          <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
            <div className="font-display text-5xl font-bold text-accent">
              2–5x
            </div>
            <p className="font-body text-sm text-primary-foreground/80 mt-space-2">
              {lang === "no" 
                ? "mer output fra de samme menneskene når repeterbare oppgaver flyttes til AI-støttede roller." 
                : "more output from the same people when repetitive tasks are moved to AI-supported roles."}
            </p>
          </div>

          <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
            <div className="font-display text-5xl font-bold text-accent">
              30 dager
            </div>
            <p className="font-body text-sm text-primary-foreground/80 mt-space-2">
              {lang === "no"
                ? "til første AI-støttede arbeidsflyt er operativ. Ingen kode. Ingen IT-prosjekt."
                : "to your first AI-supported workflow being operational. No code. No IT project."}
            </p>
          </div>

          <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
            <div className="font-display text-5xl font-bold text-accent">
              7 roller
            </div>
            <p className="font-body text-sm text-primary-foreground/80 mt-space-2">
              {lang === "no"
                ? "tilgjengelige nå. Velg kategori, konfigurer, koble til din arbeidsflate."
                : "available now. Choose category, configure, connect to your workspace."}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-space-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-foreground/50 cursor-pointer" onClick={scrollToApp}>
        <span className="font-body text-xs uppercase tracking-widest">
          {lang === "no" ? "Se mer" : "Explore"}
        </span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
}

export default function App() {
  const [lang, setLang] = useState<"no" | "en">("no");
  const [mainTab, setMainTab] = useState<"roles" | "perspective" | "builder">("roles");
  const [selectedRole, setSelectedRole] = useState("meeting");
  const [selectedDepth, setSelectedDepth] = useState("overview");
  const appMainRef = useRef<HTMLDivElement>(null);

  const copy = {
    no: {
      appTitle: "Employees 361 — AI-støttede medarbeidere for norske SMB-er",
      appSubtitle:
        "En interaktiv visning av hvilke AI-drevne roller som kan frigjøre kapasitet, styrke kvalitet og øke tempo i din virksomhet.",
      langLabel: "Språk",
      norwegian: "Norsk",
      english: "English",
      introEyebrow: "Fra ekspertise til skalering",
      introTitle: "Dette handler ikke om mer AI. Det handler om mer kapasitet.",
      introText:
        "De fleste norske SMB-er har mer erfaring og kompetanse enn de klarer å bruke. Ikke fordi de mangler talent, men fordi for mye senior-tid går til produksjon fremfor vurdering. AI-støttede roller er ikke her for å erstatte menneskene — de er her for å ta arbeidet rundt dem.",
      thesisTitle: "Kjernetese",
      thesisBody:
        "Du bør ikke skalere ved å ansette lineært. Du kan skalere ved å bygge AI-støttede arbeidsroller rundt oppgavene som i dag stjeler mest senior-tid. Det er det Employees 361 gjør.",
      sectionsTitle: "Velg en rolle og gå dypere",
      sectionsSubtitle:
        "Hver rolle viser dagens problem, AI-støttet modell, eksempel på før/etter og hva som fortsatt må eies av mennesker.",
      depthLabel: "Nivå",
      overview: "Oversikt",
      workflow: "Arbeidsflyt",
      example: "Eksempel",
      recommendation: "Anbefaling",
      demo: "Interaktiv Demo",
      currentChallenge: "Dagens utfordring",
      aiSupport: "AI-støttet rolle",
      humanRole: "Menneskelig ansvar",
      beforeAfter: "Før / etter",
      practicalFlow: "Praktisk arbeidsflyt",
      conversationPrompt: "Slik kan samtalen gå",
      responseLogic: "Responslogikk",
      recommendationTitle: "Anbefalt startpunkt",
      rolesTitle: "Roller som kan bygges først",
      recsTitle: "Strategiske anbefalinger basert på erfaringene så langt",
      recsSubtitle:
        "Disse anbefalingene er basert på erfaring fra norske SMB-er som har innført AI i hverdagen — fra første forsiktige steg til fungerende arbeidsflyter.",
      roadmapTitle: "Foreslått innføringsløp",
      roadmapSubtitle:
        "Et nøkternt løp som bygger tillit, beviser verdi og standardiserer det som faktisk virker.",
      meetingTitle: "Spørsmål som avklarer hvor du bør starte",
      meetingSubtitle:
        "Disse spørsmålene hjelper deg å identifisere hvilke arbeidsoppgaver som vil gi størst effekt raskest.",
      navTitle: "Navigasjon",
      settingsTitle: "Innstillinger",
      aboutTitle: "Om Employees 361",
      aboutText: "Employees 361 er bygget av ThreeSixtyOne — et norsk AI-rådgivningsfirma som hjelper SMB-er å gå fra AI-nysgjerrighet til faktisk gjennomføring. Besøk oss på the361.ai",
      tabRoles: "Praktiske roller",
      tabPerspective: "AI-perspektivet",
      tabBuilder: "Bygg ditt team",
      perspectiveTitle: "AI-perspektivet for SMB",
      perspectiveSubtitle: "Fra verktøy til kognitiv medarbeider – og hvorfor små og mellomstore bedrifter har en unik fordel.",
      perspectiveBlocks: [
        {
          title: "Fra verktøy til orkestrering",
          body: "AI er ikke lenger bare et verktøy på linje med Excel. Det er et 'on-demand' kognitivt lag. Vi har gått fra en verden hvor intelligens var mangelvare, til en hvor den er rikelig, akselerert og astronomisk. Spørsmålet er ikke lenger 'hvordan kan AI spare meg tid?', men 'hva kan vi skape når intelligens er ubegrenset?'"
        },
        {
          title: "SMB-fordelen",
          body: "I motsetning til store, tunge organisasjoner kan SMB-er snu seg raskt. Skalering skjer gjennom kjernepersonene som kjenner virksomheten best. Ved å la AI ta seg av administrasjon og prosjektledelse, frigjøres disse personene til ledelse, orkestrering og nyskaping."
        },
        {
          title: "Det mentale skiftet",
          body: "Tidligere var suksess bygget på å bevare knapp intelligens: 'Tenk, så gjør'. Nå er den vinnende holdningen: 'Ramm inn, generer, test, bedøm, foredle og orkestrer'. Menneskets unike, ikke-delegerbare verdi er nå smak, etiske grenser, kontekstforståelse og dømmekraft."
        },
        {
          title: "Akkumulert innsikt som Playbooks",
          body: "SMB-er sitter ofte på tiår med erfaring og innsikt. Med AI kan denne tause kunnskapen struktureres og gjøres tilgjengelig som interaktive 'playbooks' for ulike operasjoner. Det gjør at hele organisasjonen kan trekke på den akkumulerte ekspertisen til enhver tid."
        }
      ],
      journeyTitle: "Utviklingsreisen for SMB",
      journeySubtitle: "Hvordan AI-modenhet utvikler seg fra enkle oppgaver til strategisk fordel.",
      journeySteps: [
        { title: "1. Verktøy", desc: "AI brukes til isolerte oppgaver. 'Tenk, så gjør'. Fokus på effektivitet." },
        { title: "2. Assistent", desc: "AI tar over admin og prosjektledelse. Frigjør tid til kjernevirksomhet." },
        { title: "3. Orkestrering", desc: "Intelligens er overalt. Mennesket rammer inn, bedømmer og styrer." },
        { title: "4. Playbooks", desc: "Tiår med taus kunnskap gjøres interaktiv og skalerbar for hele bedriften." }
      ]
    },
    en: {
      appTitle: "Employees 361 — AI-supported employees for Nordic SMBs",
      appSubtitle:
        "An interactive showcase of which AI-powered roles can free up capacity, improve quality and increase pace in your business.",
      langLabel: "Language",
      norwegian: "Norsk",
      english: "English",
      introEyebrow: "From expertise to scale",
      introTitle: "This is not about more AI. It is about more capacity.",
      introText:
        "Most Nordic SMBs have more expertise than they can actually use. Not because they lack talent, but because too much senior time goes to production rather than judgment. AI-supported roles are not here to replace people — they are here to take the work around them.",
      thesisTitle: "Core thesis",
      thesisBody:
        "You should not scale by hiring linearly. You can scale by building AI-supported working roles around the tasks that currently consume the most senior time. That is what Employees 361 does.",
      sectionsTitle: "Choose a role and go deeper",
      sectionsSubtitle:
        "Each role shows today’s problem, the AI-supported model, a before/after example, and what humans still need to own.",
      depthLabel: "Level",
      overview: "Overview",
      workflow: "Workflow",
      example: "Example",
      recommendation: "Recommendation",
      demo: "Interactive Demo",
      currentChallenge: "Current challenge",
      aiSupport: "AI-supported role",
      humanRole: "Human responsibility",
      beforeAfter: "Before / after",
      practicalFlow: "Practical workflow",
      conversationPrompt: "How the conversation can sound",
      responseLogic: "Response logic",
      recommendationTitle: "Recommended starting point",
      rolesTitle: "Roles worth building first",
      recsTitle: "Strategic recommendations based on experience so far",
      recsSubtitle:
        "These recommendations are based on experience from Nordic SMBs that have introduced AI into their daily work — from the first cautious steps to functioning workflows.",
      roadmapTitle: "Suggested rollout path",
      roadmapSubtitle:
        "A practical rollout that builds trust, proves value and standardises what actually works.",
      meetingTitle: "Questions that clarify where to begin",
      meetingSubtitle:
        "These questions help you identify which tasks will deliver the most impact the fastest.",
      navTitle: "Navigation",
      settingsTitle: "Settings",
      aboutTitle: "About Employees 361",
      aboutText: "Employees 361 is built by ThreeSixtyOne — a Norwegian AI consultancy that helps SMBs move from AI curiosity to actual implementation. Visit us at the361.ai",
      tabRoles: "Practical roles",
      tabPerspective: "The AI perspective",
      tabBuilder: "Build your team",
      perspectiveTitle: "The AI Perspective for SMBs",
      perspectiveSubtitle: "From tools to cognitive co-workers – and why small and medium businesses have a unique advantage.",
      perspectiveBlocks: [
        {
          title: "From Tool to Orchestration",
          body: "AI is no longer just a tool like Excel. It is an on-demand cognitive layer. We have moved from a world of scarce intelligence to one where it is abundant, accelerated, and astronomical. The question is no longer 'how can AI save me time?', but 'what can we create when intelligence is unlimited?'"
        },
        {
          title: "The SMB Advantage",
          body: "Unlike large, rigid enterprises, SMBs can move fast. Scaling happens through the core people who know the business best. By letting AI handle admin and project management, these key individuals are freed up for leadership, orchestration, and creation."
        },
        {
          title: "The Mental Pivot",
          body: "Previously, success meant conserving scarce intelligence: 'Think, then do'. Now, the winning posture is: 'Frame, generate, test, judge, refine, orchestrate'. The unique, non-delegable human value is now taste, ethical boundaries, context reading, and judgment."
        },
        {
          title: "Accumulated Insights as Playbooks",
          body: "SMBs sit on decades of experience and insight. With AI, this tacit knowledge can be structured and accessed as interactive playbooks for various operations. This allows the entire organization to draw upon accumulated expertise at any time."
        }
      ],
      journeyTitle: "The SMB Evolution Journey",
      journeySubtitle: "How AI maturity evolves from simple tasks to strategic advantage.",
      journeySteps: [
        { title: "1. Tools", desc: "AI is used for isolated tasks. 'Think, then do'. Focus on efficiency." },
        { title: "2. Assistant", desc: "AI takes over admin and project management. Frees time for core business." },
        { title: "3. Orchestration", desc: "Intelligence is abundant. Humans frame, judge, and direct." },
        { title: "4. Playbooks", desc: "Decades of tacit knowledge become interactive and scalable for the whole company." }
      ]
    },
  };

  const roles: Record<string, any> = {
    meeting: {
      no: {
        label: "Møteassistent",
        challenge:
          "Mye tid går med til å skrive referater, fange opp beslutninger og fordele aksjonspunkter etter møter.",
        ai:
          "En AI-støttet møteassistent transkriberer samtalen, oppsummerer hovedpunktene, og lister opp beslutninger og neste steg automatisk.",
        human:
          "Mennesket styrer møtet, sikrer at de riktige beslutningene tas, og kvalitetssikrer at AI-ens oppsummering fanger opp nyansene.",
        beforeAfter:
          "Før: En deltaker må bruke tid på å notere og renskrive referat i etterkant. Etter: Referat og aksjonspunkter er klare umiddelbart etter møtet.",
        workflow: [
          "Ta opp møtet med et transkripsjonsverktøy.",
          "La AI generere et strukturert referat med hovedpunkter.",
          "Be AI trekke ut alle beslutninger og aksjonspunkter med ansvarlig person.",
          "Se over referatet for å sikre at tonen og nyansene er riktige.",
          "Del referatet med deltakerne umiddelbart."
        ],
        example: {
          prompt:
            "Her er transkripsjonen fra ukens statusmøte. Lag et kort referat med de tre viktigste diskusjonspunktene, en liste over beslutninger, og en tabell med aksjonspunkter, hvem som er ansvarlig, og frist.",
          answer:
            "Dette frigjør tid for alle møtedeltakere og sikrer at ingenting faller mellom stolene, samtidig som fremdriften opprettholdes."
        },
        recommendation:
          "Dette er et utmerket startpunkt for alle bedrifter, da det gir umiddelbar tidsbesparelse og er svært enkelt å implementere."
      },
      en: {
        label: "Meeting assistant",
        challenge:
          "A lot of time is spent writing minutes, capturing decisions, and assigning action items after meetings.",
        ai:
          "An AI-supported meeting assistant transcribes the conversation, summarizes the main points, and automatically lists decisions and next steps.",
        human:
          "Humans lead the meeting, ensure the right decisions are made, and quality-check that the AI's summary captures the nuances.",
        beforeAfter:
          "Before: One participant has to spend time taking notes and writing up minutes afterwards. After: Minutes and action items are ready immediately after the meeting.",
        workflow: [
          "Record the meeting using a transcription tool.",
          "Let AI generate structured minutes with key takeaways.",
          "Ask AI to extract all decisions and action items with the responsible person.",
          "Review the minutes to ensure tone and nuances are correct.",
          "Share the minutes with participants immediately."
        ],
        example: {
          prompt:
            "Here is the transcript from this week's status meeting. Create a short summary with the three most important discussion points, a list of decisions, and a table with action items, who is responsible, and the deadline.",
          answer:
            "This frees up time for all meeting participants and ensures nothing falls through the cracks, while maintaining momentum."
        },
        recommendation:
          "This is an excellent starting point for all companies, as it provides immediate time savings and is very easy to implement."
      }
    },
    document: {
      no: {
        label: "Dokumentbehandler",
        challenge:
          "Ansatte bruker mye tid på å lese gjennom lange dokumenter, kontrakter eller anbud for å finne spesifikk informasjon eller oppsummere innholdet.",
        ai:
          "En AI-støttet dokumentbehandler kan raskt analysere store tekstmengder, trekke ut nøkkelinformasjon, identifisere risikoer og lage sammendrag.",
        human:
          "Mennesket vurderer informasjonen, tar de strategiske beslutningene basert på funnene, og håndterer komplekse unntak.",
        beforeAfter:
          "Før: Timer med manuell lesing for å finne de viktigste klausulene eller kravene. Etter: AI gir deg en strukturert oversikt på sekunder, slik at du kan fokusere på vurderingen.",
        workflow: [
          "Last opp lange dokumenter, PDF-er eller anbudstekster til en sikker AI-løsning.",
          "Be AI om å oppsummere hovedinnholdet i et kort format.",
          "Spør AI om spesifikke detaljer, for eksempel 'Hva er betalingsbetingelsene?' eller 'Hvilke frister nevnes?'.",
          "La AI flagge potensielle risikoer eller avvik fra standardvilkår.",
          "Bruk innsikten til å ta raskere og mer informerte beslutninger."
        ],
        example: {
          prompt:
            "Les gjennom denne 50-siders kontrakten. Oppsummer de viktigste forpliktelsene for vår part, list opp alle tidsfrister, og flagg eventuelle uvanlige ansvarsbegrensninger.",
          answer:
            "Dette reduserer tiden brukt på informasjonsinnhenting drastisk, og lar fagpersoner bruke ekspertisen sin på analyse og forhandling."
        },
        recommendation:
          "Svært verdifullt for roller som håndterer mye tekst, som jurister, selgere, prosjektledere og saksbehandlere."
      },
      en: {
        label: "Document processor",
        challenge:
          "Employees spend a lot of time reading through long documents, contracts, or tenders to find specific information or summarize the content.",
        ai:
          "An AI-supported document processor can quickly analyze large volumes of text, extract key information, identify risks, and create summaries.",
        human:
          "Humans evaluate the information, make strategic decisions based on the findings, and handle complex exceptions.",
        beforeAfter:
          "Before: Hours of manual reading to find the most important clauses or requirements. After: AI gives you a structured overview in seconds, allowing you to focus on the assessment.",
        workflow: [
          "Upload long documents, PDFs, or tender texts to a secure AI solution.",
          "Ask AI to summarize the main content in a short format.",
          "Ask AI for specific details, such as 'What are the payment terms?' or 'What deadlines are mentioned?'.",
          "Let AI flag potential risks or deviations from standard terms.",
          "Use the insights to make faster and more informed decisions."
        ],
        example: {
          prompt:
            "Read through this 50-page contract. Summarize the main obligations for our party, list all deadlines, and flag any unusual limitations of liability.",
          answer:
            "This drastically reduces the time spent on information retrieval, allowing experts to use their skills on analysis and negotiation."
        },
        recommendation:
          "Highly valuable for roles handling a lot of text, such as lawyers, sales representatives, project managers, and caseworkers."
      }
    },
    content: {
      no: {
        label: "Innholdsprodusent",
        challenge:
          "Det tar mye tid å produsere engasjerende innhold til sosiale medier, nyhetsbrev og nettsider, noe som ofte fører til at markedsføringen nedprioriteres.",
        ai:
          "En AI-støttet innholdsprodusent genererer utkast til artikler, sosiale medier-innlegg og nyhetsbrev basert på stikkord, tidligere innhold og bedriftens tone-of-voice.",
        human:
          "Mennesket eier strategien, godkjenner innholdet, sikrer at det stemmer overens med merkevaren, og publiserer det.",
        beforeAfter:
          "Før: Skrivesperre og timer brukt på å formulere én artikkel. Etter: Førsteutkast er klart på minutter, og tiden brukes på redigering og finpuss.",
        workflow: [
          "Definer målgruppe og budskap for innholdet.",
          "Gi AI stikkord eller et tidligere dokument som utgangspunkt.",
          "La AI generere 3 ulike utkast med ulik tone.",
          "Velg det beste utkastet og gjør manuelle justeringer.",
          "Publiser innholdet i valgte kanaler."
        ],
        example: {
          prompt:
            "Skriv et engasjerende LinkedIn-innlegg om vår nye bærekraftsrapport. Bruk en profesjonell, men entusiastisk tone. Inkluder tre hovedfunn og avslutt med et spørsmål til leserne.",
          answer:
            "Dette sikrer jevn og høy kvalitet på kommunikasjonen utad, selv i perioder med høy arbeidsbelastning."
        },
        recommendation:
          "Ideelt for bedrifter som ønsker å øke sin synlighet på nett uten å måtte ansette et stort markedsføringsteam."
      },
      en: {
        label: "Content creator",
        challenge:
          "Producing engaging content for social media, newsletters, and websites takes a lot of time, often leading to marketing being deprioritized.",
        ai:
          "An AI-supported content creator generates drafts for articles, social media posts, and newsletters based on keywords, previous content, and the company's tone of voice.",
        human:
          "Humans own the strategy, approve the content, ensure it aligns with the brand, and publish it.",
        beforeAfter:
          "Before: Writer's block and hours spent drafting a single article. After: First drafts are ready in minutes, and time is spent on editing and polishing.",
        workflow: [
          "Define the target audience and message for the content.",
          "Give AI keywords or a previous document as a starting point.",
          "Let AI generate 3 different drafts with varying tones.",
          "Choose the best draft and make manual adjustments.",
          "Publish the content in the chosen channels."
        ],
        example: {
          prompt:
            "Write an engaging LinkedIn post about our new sustainability report. Use a professional yet enthusiastic tone. Include three key findings and end with a question for the readers.",
          answer:
            "This ensures consistent and high-quality external communication, even during periods of high workload."
        },
        recommendation:
          "Ideal for companies looking to increase their online visibility without having to hire a large marketing team."
      }
    },
    customer: {
      no: {
        label: "Kundeservice",
        challenge:
          "Kundeservice bruker mye tid på å svare på de samme standardspørsmålene, noe som gir lengre ventetid for komplekse henvendelser.",
        ai:
          "En AI-støttet kundebehandler analyserer innkommende henvendelser, foreslår svar basert på tidligere historikk og kunnskapsbaser, og kan håndtere enkle spørsmål automatisk.",
        human:
          "Mennesket tar over komplekse saker, bygger relasjoner med kundene, og håndterer situasjoner som krever empati og skjønn.",
        beforeAfter:
          "Før: Innboksen renner over av enkle spørsmål om åpningstider og returvilkår. Etter: AI håndterer 60% av volumet, mens teamet løser de virkelige problemene.",
        workflow: [
          "Koble AI til bedriftens innboks og kunnskapsbase.",
          "La AI kategorisere og prioritere innkommende e-poster.",
          "AI foreslår et svar som kundebehandleren kan godkjenne med ett klikk.",
          "For komplekse saker, gir AI et sammendrag av kundens historikk.",
          "Kundebehandleren tar over og løser saken personlig."
        ],
        example: {
          prompt:
            "Kunden spør om status på ordre #12345. Sjekk systemet, se at pakken er forsinket, og skriv et høflig svar som beklager forsinkelsen og gir ny estimert leveringsdato.",
          answer:
            "Dette gir raskere responstid for kundene og en mer givende arbeidshverdag for kundeserviceteamet."
        },
        recommendation:
          "Anbefales sterkt for bedrifter med høyt volum av kundehenvendelser og standardiserte prosesser."
      },
      en: {
        label: "Customer service",
        challenge:
          "Customer service spends a lot of time answering the same standard questions, resulting in longer wait times for complex inquiries.",
        ai:
          "An AI-supported customer service agent analyzes incoming inquiries, suggests answers based on past history and knowledge bases, and can handle simple questions automatically.",
        human:
          "Humans take over complex cases, build relationships with customers, and handle situations that require empathy and judgment.",
        beforeAfter:
          "Before: The inbox overflows with simple questions about opening hours and return policies. After: AI handles 60% of the volume, while the team solves the real problems.",
        workflow: [
          "Connect AI to the company's inbox and knowledge base.",
          "Let AI categorize and prioritize incoming emails.",
          "AI suggests an answer that the agent can approve with one click.",
          "For complex cases, AI provides a summary of the customer's history.",
          "The agent takes over and resolves the case personally."
        ],
        example: {
          prompt:
            "The customer is asking about the status of order #12345. Check the system, see that the package is delayed, and write a polite reply apologizing for the delay and providing a new estimated delivery date.",
          answer:
            "This provides faster response times for customers and a more rewarding workday for the customer service team."
        },
        recommendation:
          "Highly recommended for companies with a high volume of customer inquiries and standardized processes."
      }
    },
    reporting: {
      no: {
        label: "Rapportering og analyse",
        challenge:
          "Å samle inn data fra ulike systemer og bygge månedlige rapporter er en manuell, feilutsatt og tidkrevende prosess.",
        ai:
          "En AI-støttet analytiker trekker ut data fra regneark og systemer, identifiserer trender, og genererer ferdige rapporter med visualiseringer og innsikt.",
        human:
          "Mennesket definerer hvilke KPI-er som er viktige, tolker AI-ens funn i en forretningskontekst, og fatter strategiske beslutninger.",
        beforeAfter:
          "Før: Dager brukes på å klippe og lime data i Excel. Etter: Rapporten genereres automatisk, og tiden brukes på å forstå hva tallene betyr.",
        workflow: [
          "Last opp rådata eller koble AI til bedriftens datakilder.",
          "Be AI om å sammenstille tallene for forrige måned.",
          "La AI identifisere avvik, trender og forbedringsområder.",
          "Gå gjennom rapporten og legg til strategiske kommentarer.",
          "Del den ferdige rapporten med ledelsen eller styret."
        ],
        example: {
          prompt:
            "Analyser salgsdataene for Q3. Lag et sammendrag som viser veksten sammenlignet med Q2, identifiser de tre bestselgende produktene, og foreslå årsaker til eventuelle nedganger i spesifikke regioner.",
          answer:
            "Dette flytter fokuset fra datainnsamling til datadrevet beslutningstaking, noe som gir et enormt konkurransefortrinn."
        },
        recommendation:
          "Kritisk for ledere og økonomiteam som trenger oppdatert styringsinformasjon uten forsinkelser."
      },
      en: {
        label: "Reporting and analysis",
        challenge:
          "Gathering data from various systems and building monthly reports is a manual, error-prone, and time-consuming process.",
        ai:
          "An AI-supported analyst extracts data from spreadsheets and systems, identifies trends, and generates finished reports with visualizations and insights.",
        human:
          "Humans define which KPIs are important, interpret the AI's findings in a business context, and make strategic decisions.",
        beforeAfter:
          "Before: Days are spent copying and pasting data in Excel. After: The report is generated automatically, and time is spent understanding what the numbers mean.",
        workflow: [
          "Upload raw data or connect AI to the company's data sources.",
          "Ask AI to compile the numbers for the previous month.",
          "Let AI identify anomalies, trends, and areas for improvement.",
          "Review the report and add strategic commentary.",
          "Share the finished report with management or the board."
        ],
        example: {
          prompt:
            "Analyze the sales data for Q3. Create a summary showing the growth compared to Q2, identify the three best-selling products, and suggest reasons for any declines in specific regions.",
          answer:
            "This shifts the focus from data collection to data-driven decision-making, providing a massive competitive advantage."
        },
        recommendation:
          "Critical for managers and finance teams who need updated management information without delays."
      }
    },
    onboarding: {
      no: {
        label: "Nyansatt-opplæring",
        challenge:
          "Opplæring av nye ansatte krever mye tid fra nøkkelpersonell, og informasjonen er ofte spredt på tvers av ulike dokumenter og systemer.",
        ai:
          "En AI-støttet onboarding-assistent fungerer som en interaktiv mentor som kan svare på spørsmål om rutiner, systemer og kultur basert på bedriftens håndbøker.",
        human:
          "Mennesket bygger den sosiale relasjonen, overfører taus kunnskap, og sørger for at den nyansatte føler seg velkommen i teamet.",
        beforeAfter:
          "Før: Senioransatte blir stadig avbrutt for å svare på hvor man finner maler eller hvordan reiseregninger fungerer. Etter: Den nyansatte spør AI-en først, og får umiddelbare, korrekte svar.",
        workflow: [
          "Samle personalhåndbok, rutinebeskrivelser og maler i en AI-kunnskapsbase.",
          "Gi den nyansatte tilgang til AI-assistenten fra dag én.",
          "La den nyansatte stille spørsmål i naturlig språk (f.eks. 'Hvordan bestiller jeg IT-utstyr?').",
          "AI gir et presist svar med lenker til relevante systemer.",
          "Lederen bruker tiden på 1-til-1-samtaler om mål og utvikling."
        ],
        example: {
          prompt:
            "Jeg er ny i salgsteamet. Kan du gi meg en steg-for-steg guide til hvordan jeg registrerer en ny kunde i CRM-systemet, og hvilke maler jeg skal bruke for det første møtet?",
          answer:
            "Dette gir en tryggere og raskere oppstart for den nyansatte, samtidig som det beskytter tiden til erfarne kollegaer."
        },
        recommendation:
          "Spesielt verdifullt for bedrifter i vekst som ansetter jevnlig og trenger å standardisere opplæringen."
      },
      en: {
        label: "Onboarding",
        challenge:
          "Training new employees requires a lot of time from key personnel, and information is often scattered across various documents and systems.",
        ai:
          "An AI-supported onboarding assistant acts as an interactive mentor that can answer questions about routines, systems, and culture based on company handbooks.",
        human:
          "Humans build the social relationship, transfer tacit knowledge, and ensure the new employee feels welcome in the team.",
        beforeAfter:
          "Before: Senior staff are constantly interrupted to answer where to find templates or how travel expenses work. After: The new hire asks the AI first and gets immediate, correct answers.",
        workflow: [
          "Gather the employee handbook, routine descriptions, and templates in an AI knowledge base.",
          "Give the new hire access to the AI assistant from day one.",
          "Let the new hire ask questions in natural language (e.g., 'How do I order IT equipment?').",
          "AI provides a precise answer with links to relevant systems.",
          "The manager spends time on 1-on-1 conversations about goals and development."
        ],
        example: {
          prompt:
            "I am new to the sales team. Can you give me a step-by-step guide on how to register a new customer in the CRM system, and which templates I should use for the first meeting?",
          answer:
            "This provides a safer and faster start for the new employee, while protecting the time of experienced colleagues."
        },
        recommendation:
          "Especially valuable for growing companies that hire regularly and need to standardize training."
      }
    }
  };

  const recommendations = {
    no: [
      {
        title: "Start med lav risiko og høy nytte",
        body:
          "Erfaringene fra AI-adopsjon tilsier at man bør starte der verdien er enkel å se og kontrollen er høy. Derfor er workshop-oppsummering, innsiktsdestillering og presentasjonsutkast bedre startpunkter enn full kreativ automatisering eller aggressiv new biz.",
      },
      {
        title: "Bygg kapabiliteter, ikke bare prompts",
        body:
          "Det viktige er ikke å lage én god prompt. Det viktige er å etablere faste arbeidsmåter: hvilke dokumenter som brukes, hva output skal inneholde, hvem som kvalitetssikrer, og hvordan læringen forbedres over tid.",
      },
      {
        title: "Bruk AI som tenkepartner og produksjonsmotor i ulike faser",
        body:
          "Noen oppgaver trenger AI som utfordrer og idépartner. Andre trenger AI som utfører kjedelige og repeterbare steg. Å skille mellom disse modusene øker kvaliteten og senker frustrasjonen.",
      },
      {
        title: "Gjør stemme og kvalitet eksplisitt",
        body:
          "Når output er merkevarenær, presentasjonsnær eller kundeeksponert, bør man bygge eksempler og toneguider. Ellers blir resultatene generiske, og teamet mister tillit til verktøyet.",
      },
      {
        title: "Tenk seks måneder, ikke seks dager",
        body:
          "Den sterkeste innføringen er ikke et engangseksperiment. Den er en 6-måneders progresjon: først vaner og enkle gevinster, deretter noen standardiserte arbeidsflyter, og til slutt små verktøy eller mikrotjenester rundt det som beviselig fungerer.",
      },
    ],
    en: [
      {
        title: "Start with low risk and high usefulness",
        body:
          "Experience from AI adoption suggests starting where value is easy to see and control is high. That makes workshop summaries, insight distillation and presentation drafts better starting points than full creative automation or aggressive new business automation.",
      },
      {
        title: "Build capabilities, not just prompts",
        body:
          "What matters is not one great prompt. What matters is a repeatable way of working: which documents are used, what the output must contain, who quality-checks it and how the learning improves over time.",
      },
      {
        title: "Use AI as both thinking partner and production engine",
        body:
          "Some tasks need AI as a challenger and idea partner. Others need AI to execute boring and repetitive steps. Separating those modes improves quality and reduces frustration.",
      },
      {
        title: "Make voice and quality explicit",
        body:
          "When the output is close to the brand, presentation-heavy or client-facing, you should build examples and tone guides. Otherwise results become generic and the team loses trust.",
      },
      {
        title: "Think six months, not six days",
        body:
          "The strongest rollout is not a one-off experiment. It is a six-month progression: first habits and easy wins, then a few standardised workflows, and finally small tools or micro-services around what clearly works.",
      },
    ],
  };

  const roadmap = {
    no: [
      {
        title: "Fase 1 · frigjør tid",
        body:
          "Start med 2 konkrete flyter: workshop-oppsummering og innsiktsarbeid. Bevis at kvaliteten blir god nok og at tiden faktisk går ned.",
      },
      {
        title: "Fase 2 · standardiser leveransen",
        body:
          "Bygg faste maler, roller, kvalitetskontroller og output-strukturer for presentasjoner og konseptutvikling. Her begynner arbeidsmåten å bli en modell, ikke bare eksperimenter.",
      },
      {
        title: "Fase 3 · utvid kommersiell motor",
        body:
          "Når mer kapasitet er frigjort, kan SoMe og new biz bygges rundt ekte arbeid, tydelig posisjonering og mer systematisk oppfølging.",
      },
    ],
    en: [
      {
        title: "Phase 1 · free up time",
        body:
          "Start with 2 concrete flows: workshop summarising and insight work. Prove that quality is good enough and that time genuinely goes down.",
      },
      {
        title: "Phase 2 · standardise delivery",
        body:
          "Build fixed templates, roles, quality controls and output structures for presentations and concept work. This is where the way of working becomes a model, not just experiments.",
      },
      {
        title: "Phase 3 · expand the commercial engine",
        body:
          "Once more capacity is freed up, social media and new business can be built around real work, clear positioning and more systematic follow-up.",
      },
    ],
  };

  const meetingQuestions = {
    no: [
      "Hvor går mest tid i din virksomhet til oppgaver som gjentas uke etter uke?",
      "Hvilke oppgaver ville du delegert i dag hvis du hadde en ekstra ressurs?",
      "Hva er den største flaskehalsen mellom en god idé og ferdig leveranse?",
      "Hvilke beslutninger tar lengst tid fordi det mangler riktig informasjon?",
      "Hvor mye senior-tid brukes på å produsere fremfor å vurdere og beslutte?",
      "Hvis du skulle doble kapasiteten uten å ansette — hvor ville du startet?",
    ],
    en: [
      "Where does the most time in your business go to tasks that repeat week after week?",
      "Which tasks would you delegate today if you had one extra resource?",
      "What is the biggest bottleneck between a good idea and a finished deliverable?",
      "Which decisions take the longest because the right information is missing?",
      "How much senior time is spent producing rather than judging and deciding?",
      "If you had to double capacity without hiring — where would you start?",
    ],
  };

  const roleKeys = Object.keys(roles);
  const activeRole = roles[selectedRole][lang];
  const ui = copy[lang];

  const roleButtons = useMemo(
    () => roleKeys.map((key) => ({ key, label: roles[key][lang].label })),
    [lang]
  );

  const depthOptions = [
    { key: "overview", label: ui.overview },
    { key: "workflow", label: ui.workflow },
    { key: "example", label: ui.example },
    { key: "recommendation", label: ui.recommendation },
    { key: "demo", label: ui.demo },
  ];

  function InfoCard({ title, body }: { title: string; body: string }) {
    return (
      <div className="bg-card border border-border rounded-lg p-space-4 space-y-space-2 h-full">
        <h4 className="font-display text-lg font-medium text-foreground tracking-headline">
          {title}
        </h4>
        <p className="font-body text-sm text-muted-foreground leading-reading">
          {body}
        </p>
      </div>
    );
  }


  function renderDepthContent() {
    if (selectedDepth === "overview") {
      return (
        <div className="grid gap-space-4 md:grid-cols-3">
          <InfoCard title={ui.currentChallenge} body={activeRole.challenge} />
          <InfoCard title={ui.aiSupport} body={activeRole.ai} />
          <InfoCard title={ui.humanRole} body={activeRole.human} />
          <div className="md:col-span-3">
            <InfoCard title={ui.beforeAfter} body={activeRole.beforeAfter} />
          </div>
        </div>
      );
    }

    if (selectedDepth === "workflow") {
      return (
        <div className="bg-card border border-border rounded-lg p-space-6">
          <h3 className="font-display text-xl font-medium text-foreground tracking-headline mb-space-6">
            {ui.practicalFlow}
          </h3>
          <div className="relative border-l border-border ml-space-4 space-y-space-6 py-space-2">
            {activeRole.workflow.map((step: string, i: number) => (
              <div key={i} className="relative pl-space-6">
                <div className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border font-body text-sm font-medium text-foreground">
                  {i + 1}
                </div>
                <p className="font-body text-foreground leading-reading pt-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedDepth === "example") {
      return (
        <div className="grid gap-space-5 md:grid-cols-2">
          {/* Anchor Context Panel */}
          <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-3">
            <div className="font-body text-xs font-medium uppercase tracking-wider text-accent">
              {ui.conversationPrompt}
            </div>
            <p className="font-body text-base leading-reading opacity-90 whitespace-pre-line">
              {activeRole.example.prompt}
            </p>
          </div>
          {/* Primary Context Card */}
          <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-3">
            <div className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {ui.responseLogic}
            </div>
            <p className="font-body text-base text-foreground leading-reading">
              {activeRole.example.answer}
            </p>
          </div>
        </div>
      );
    }

    if (selectedDepth === "demo") {
      return (
        <div className="bg-card border border-border rounded-lg p-space-6 text-center py-space-12">
          <p className="font-body text-muted-foreground">
            {lang === "no" ? "Demo for denne rollen er under utvikling." : "Demo for this role is under development."}
          </p>
        </div>
      );
    }

    return (
      <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-3">
        <h3 className="font-display text-xl font-medium text-foreground tracking-headline">
          {ui.recommendationTitle}
        </h3>
        <p className="font-body text-base text-muted-foreground leading-reading">
          {activeRole.recommendation}
        </p>
      </div>
    );
  }

  return (
    <>
      <HeroSection lang={lang} setLang={setLang} setMainTab={setMainTab} />
      <div id="app-main" ref={appMainRef} className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto">
        <div className="p-space-6 space-y-space-8">
          {/* Hero Section */}
          <div className="space-y-space-4">
            <p className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {ui.introEyebrow}
            </p>
            <h1 className="font-display text-3xl font-medium leading-hero text-foreground">
              {ui.appTitle}
            </h1>
            <p className="font-body text-sm text-muted-foreground leading-reading">
              {ui.appSubtitle}
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-space-3">
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {ui.navTitle}
            </h3>
            <div className="flex flex-col gap-space-2">
              <button
                onClick={() => setMainTab("perspective")}
                className={`h-[44px] px-space-4 rounded-lg font-body text-sm font-medium transition-colors text-left ${
                  mainTab === "perspective"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.tabPerspective}
              </button>
              <button
                onClick={() => setMainTab("roles")}
                className={`h-[44px] px-space-4 rounded-lg font-body text-sm font-medium transition-colors text-left ${
                  mainTab === "roles"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.tabRoles}
              </button>
              <button
                onClick={() => setMainTab("builder")}
                className={`h-[44px] px-space-4 rounded-lg font-body text-sm font-medium transition-colors text-left ${
                  mainTab === "builder"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.tabBuilder}
              </button>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-space-3">
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {ui.settingsTitle}
            </h3>
            <div className="flex items-center gap-space-2 bg-background border border-border rounded-full p-1 w-fit">
              <span className="pl-space-3 pr-space-1 font-body text-sm text-muted-foreground">
                {ui.langLabel}
              </span>
              <button
                onClick={() => setLang("no")}
                className={`h-[36px] px-space-4 rounded-full font-body text-sm font-medium transition-colors ${
                  lang === "no"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.norwegian}
              </button>
              <button
                onClick={() => setLang("en")}
                className={`h-[36px] px-space-4 rounded-full font-body text-sm font-medium transition-colors ${
                  lang === "en"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.english}
              </button>
            </div>
          </div>

          {/* About */}
          <div className="space-y-space-3 pt-space-4 border-t border-border">
            <h3 className="font-body text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {ui.aboutTitle}
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-reading">
              {ui.aboutText}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-space-4 md:p-space-8 lg:p-space-10 space-y-space-8 overflow-y-auto pb-space-9">
        {/* Panel Pairing: Intro & Thesis */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-space-5">
          {/* Primary Context Card */}
          <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-4">
            <h2 className="font-display text-2xl font-medium tracking-headline text-foreground">
              {ui.introTitle}
            </h2>
            <p className="font-body text-base text-muted-foreground leading-reading">
              {ui.introText}
            </p>
          </div>
          {/* Anchor Context Panel */}
          <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-4">
            <h3 className="font-display text-xl font-medium tracking-headline text-accent">
              {ui.thesisTitle}
            </h3>
            <p className="font-body text-base leading-reading opacity-90">
              {ui.thesisBody}
            </p>
          </div>
        </section>

        {mainTab === "perspective" && (
          <section className="space-y-space-8 md:space-y-space-9 animate-in fade-in duration-500">
            {/* SUBSECTION 1 — The core multiplier statement */}
            <div className="bg-primary text-primary-foreground rounded-lg p-space-8 md:p-space-10">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-space-8">
                {/* Left side */}
                <div>
                  <div className="font-body text-xs uppercase tracking-widest text-accent mb-space-4">
                    {lang === "no" ? "Kjernetesen" : "The core thesis"}
                  </div>
                  <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground leading-tight max-w-[20ch]">
                    {lang === "no" 
                      ? "Et lite team skalerer ikke ved å ansette lineært." 
                      : "A small team does not scale by hiring linearly."}
                  </h2>
                  <p className="font-body text-lg text-primary-foreground/85 leading-relaxed mt-space-5 max-w-[48ch]">
                    {lang === "no"
                      ? "Det skalerer ved å la hvert menneske operere som en orkestrator — støttet av AI-roller som håndterer research, produksjon og repetisjon. Resultatet er ikke et større team. Det er et raskere, skarpere og mer konsistent ett."
                      : "It scales by letting each person operate as an orchestrator — supported by AI roles that handle research, production and repetition. The result is not a larger team. It is a faster, sharper and more consistent one."}
                  </p>
                </div>
                
                {/* Right side */}
                <div className="flex flex-col gap-space-5">
                  <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
                    <div className="font-display text-4xl font-bold text-accent">2–5x</div>
                    <div className="font-body text-sm text-primary-foreground/80 mt-1">
                      {lang === "no" ? "mer output fra de samme menneskene" : "more output from the same people"}
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
                    <div className="font-display text-4xl font-bold text-accent">30 dager</div>
                    <div className="font-body text-sm text-primary-foreground/80 mt-1">
                      {lang === "no" ? "til første operative AI-arbeidsflyt" : "to your first operational AI workflow"}
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/15 rounded-lg p-space-5">
                    <div className="font-display text-4xl font-bold text-accent">100%</div>
                    <div className="font-body text-sm text-primary-foreground/80 mt-1">
                      {lang === "no" ? "menneskelig kontroll — alltid" : "human control — always"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION 2 — What the team becomes vs what AI handles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-5">
              {/* LEFT CARD */}
              <div className="bg-card border border-border rounded-lg p-space-7">
                <div className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-space-5">
                  {lang === "no" ? "Hva kjerneteamet ditt blir" : "What your core team becomes"}
                </div>
                <ul className="space-y-space-4">
                  {[
                    lang === "no" ? "En orkestrator av arbeidsflyter i stedet for en manuell repetatør" : "An orchestrator of workflows rather than a manual repeater",
                    lang === "no" ? "En vurderer av output i stedet for produsent av hvert førsteutkast" : "A reviewer of outputs rather than a producer of every first draft",
                    lang === "no" ? "En beslutningstaker med AI-research og strukturert analyse" : "A decision-maker with AI research and structured analysis",
                    lang === "no" ? "En forvalter av kvalitet og kontekst — ikke en flaskehals" : "A guardian of quality and context — not a bottleneck"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-space-3">
                      <ArrowRight className="text-accent w-5 h-5 shrink-0 mt-1" />
                      <span className="font-body text-base text-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT CARD */}
              <div className="bg-primary text-primary-foreground rounded-lg p-space-7">
                <div className="font-body text-xs uppercase tracking-wider text-accent mb-space-5">
                  {lang === "no" ? "Hva AI håndterer rundt dem" : "What AI handles around them"}
                </div>
                <ul className="space-y-space-4">
                  {[
                    lang === "no" ? "Research, oppsummering og dokumentanalyse" : "Research, summarisation and document analysis",
                    lang === "no" ? "Utkast og gjenbruk av innhold på tvers av formater" : "Drafting and repurposing content across formats",
                    lang === "no" ? "Møtefangst, aksjonspunkter og oppfølgingsstruktur" : "Meeting capture, action items and follow-up structure",
                    lang === "no" ? "Rapportering, statusoversikter og datakompilering" : "Reporting, status overviews and data compilation"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-space-3">
                      <CheckCircle2 className="text-accent w-5 h-5 shrink-0 mt-1" />
                      <span className="font-body text-base text-primary-foreground/90 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* SUBSECTION 3 — The 30-60-90 rollout model */}
            <div>
              <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                {lang === "no" ? "En praktisk innføringsmodell" : "A practical rollout model"}
              </div>
              <h3 className="font-display text-3xl font-bold text-foreground mt-space-3 max-w-[40ch] leading-tight">
                {lang === "no" ? "Fra første forsøk til fungerende system på 90 dager." : "From first attempt to working system in 90 days."}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-5 mt-space-6">
                {/* Card 1 */}
                <div className="bg-card border border-border rounded-lg p-space-6">
                  <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">30 dager</div>
                  <h4 className="font-display text-xl font-medium text-foreground mt-space-2">
                    {lang === "no" ? "Vaner og enkle gevinster" : "Habits and easy wins"}
                  </h4>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mt-space-2">
                    {lang === "no" 
                      ? "Velg ett AI-arbeidsrom for teamet. Lær tre repeterbare arbeidsflyter. Start der verdien er umiddelbar og risikoen er lav." 
                      : "Choose one AI workspace for the team. Learn three repeatable workflows. Start where value is immediate and risk is low."}
                  </p>
                </div>
                
                {/* Card 2 */}
                <div className="bg-card border border-border rounded-lg p-space-6">
                  <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">60 dager</div>
                  <h4 className="font-display text-xl font-medium text-foreground mt-space-2">
                    {lang === "no" ? "Maler og konsistens" : "Templates and consistency"}
                  </h4>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mt-space-2">
                    {lang === "no" 
                      ? "Konverter de beste arbeidsflytene til delte maler. Bygg kvalitetsregler. To interne drivere tar eierskap." 
                      : "Convert the best workflows into shared templates. Build quality rules. Two internal champions take ownership."}
                  </p>
                </div>

                {/* Card 3 */}
                <div className="bg-card border border-border rounded-lg p-space-6">
                  <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">90 dager</div>
                  <h4 className="font-display text-xl font-medium text-foreground mt-space-2">
                    {lang === "no" ? "Agenter og systemstøtte" : "Agents and system support"}
                  </h4>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed mt-space-2">
                    {lang === "no" 
                      ? "Introduser AI-agenter for gjentakende research og operativ støtte. Mål tid spart og kvalitetsgevinst." 
                      : "Introduce AI agents for recurring research and operational support. Measure time saved and quality gains."}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Journey Section */}
            <div className="mt-space-8 pt-space-6 border-t border-border space-y-space-8">
              <div className="space-y-space-2 text-center">
                <h2 className="font-display text-2xl font-medium tracking-headline text-foreground">
                  {ui.journeyTitle}
                </h2>
                <p className="font-body text-base text-muted-foreground max-w-prose mx-auto">
                  {ui.journeySubtitle}
                </p>
              </div>

              <div className="relative pt-space-4 pb-space-4">
                {/* Connecting line (hidden on mobile) */}
                <div className="hidden md:block absolute top-[44px] left-0 w-full h-0.5 bg-border z-0" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-space-6 relative z-10">
                  {ui.journeySteps.map((step: any, i: number) => (
                    <div key={i} className="flex flex-col items-center text-center space-y-space-4 relative group">
                      {/* Icon Node */}
                      <div className="w-14 h-14 rounded-full bg-card text-foreground flex items-center justify-center border-2 border-border group-hover:border-terracotta group-hover:text-terracotta transition-colors shadow-sm relative z-10">
                        {i === 0 && <Wrench className="w-6 h-6" />}
                        {i === 1 && <UserPlus className="w-6 h-6" />}
                        {i === 2 && <Network className="w-6 h-6" />}
                        {i === 3 && <BookOpen className="w-6 h-6" />}
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-space-2 px-space-2">
                        <h4 className="font-display text-lg font-medium text-foreground">{step.title}</h4>
                        <p className="font-body text-sm text-muted-foreground leading-reading">{step.desc}</p>
                      </div>

                      {/* Arrow for mobile (hidden on desktop) */}
                      {i < ui.journeySteps.length - 1 && (
                        <div className="md:hidden pt-space-2 text-border">
                          <ArrowRight className="w-5 h-5 rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {mainTab === "roles" && (
          <>
            {/* Roles Section */}
            <section className="space-y-space-6 animate-in fade-in duration-500">
              <div className="lg:flex lg:items-end lg:justify-between gap-space-6">
                <div className="space-y-space-2">
                  <div className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                    {lang === "no" ? "Seks roller. Umiddelbar verdi." : "Six roles. Immediate value."}
                  </div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight max-w-[30ch] mt-space-2">
                    {lang === "no" ? "Velg en rolle og se hva den faktisk gjør." : "Choose a role and see what it actually does."}
                  </h2>
                  <p className="font-body text-base text-muted-foreground max-w-[48ch] mt-space-3">
                    {lang === "no" 
                      ? "Hver rolle viser et konkret problem, hvordan AI-støtte løser det, og hva som fortsatt krever et menneske." 
                      : "Each role shows a concrete problem, how AI support solves it, and what still requires a human."}
                  </p>
                </div>
                {/* Depth Tabs */}
                <div className="flex flex-wrap gap-space-2 mt-space-6 lg:mt-0">
                  {depthOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedDepth(opt.key)}
                      className={`h-[44px] px-space-4 rounded-full font-body text-sm font-medium transition-colors ${
                        selectedDepth === opt.key
                          ? "bg-terracotta text-terracotta-foreground"
                          : "bg-card text-foreground border border-border hover:bg-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-3">
                {roleButtons.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedRole(item.key)}
                    className={`h-[64px] px-space-4 rounded-lg border text-left font-body font-medium transition-colors ${
                      selectedRole === item.key
                        ? "bg-terracotta border-terracotta text-terracotta-foreground"
                        : "bg-card border-border text-foreground hover:bg-border hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all duration-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Depth Content */}
              <div className="mt-space-6">{renderDepthContent()}</div>
            </section>

            {/* Recommendations & Roadmap */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-space-6 animate-in fade-in duration-500">
              {/* LEFT CARD */}
              <div className="bg-primary text-primary-foreground rounded-lg p-space-7">
                <h2 className="font-display text-2xl font-bold text-accent">
                  {lang === "no" ? "Lederens operasjonsstack" : "The leader operating stack"}
                </h2>
                <p className="font-body text-sm text-primary-foreground/80 mt-space-2">
                  {lang === "no" ? "Fem ting som faktisk utgjør forskjellen." : "Five things that actually make the difference."}
                </p>
                
                <div className="mt-space-6 space-y-space-5">
                  {[
                    {
                      noTitle: "Ett delt AI-arbeidsrom",
                      noBody: "Velg én plattform for teamet. Lagre prompts, eksempler og beslutninger slik at læringen akkumuleres.",
                      enTitle: "One shared AI workspace",
                      enBody: "Choose one platform for the team. Store prompts, examples and decisions so learning compounds."
                    },
                    {
                      noTitle: "Fem kjerne-playbooks",
                      noBody: "Dokumenter de mest repeterbare jobbene: research, utkast, møtesyntese, oppfølging og innhold. Hold dem enkle.",
                      enTitle: "Five core playbooks",
                      enBody: "Document the most repeatable jobs: research, drafting, meeting synthesis, follow-up and content. Keep them simple."
                    },
                    {
                      noTitle: "En review-stige",
                      noBody: "Definer hva AI kan gjøre alene, hva som trenger en rask sjekk, og hva som alltid krever senior godkjenning.",
                      enTitle: "A review ladder",
                      enBody: "Define what AI can do alone, what needs a quick check, and what always requires senior approval."
                    },
                    {
                      noTitle: "To interne drivere",
                      noBody: "Velg to nysgjerrige operatører som forbedrer arbeidsflytene og hjelper resten av teamet å bruke dem.",
                      enTitle: "Two internal champions",
                      enBody: "Choose two curious operators who improve workflows and help the rest of the team use them."
                    },
                    {
                      noTitle: "Ett verdi-dashboard",
                      noBody: "Mål spart tid, responstid og konsistens. Hvis det ikke gir reell verdi — stopp det.",
                      enTitle: "One value dashboard",
                      enBody: "Measure saved time, response speed and consistency. If it does not create real value — stop it."
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-space-4">
                      <div className="w-8 h-8 rounded-full bg-accent text-foreground flex items-center justify-center font-body text-sm font-medium shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-display text-lg font-medium text-primary-foreground">
                          {lang === "no" ? item.noTitle : item.enTitle}
                        </h4>
                        <p className="font-body text-sm text-primary-foreground/80 leading-relaxed mt-1">
                          {lang === "no" ? item.noBody : item.enBody}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-space-5">
                {/* TOP CARD */}
                <div className="bg-card border border-border rounded-lg p-space-7">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {lang === "no" ? "Hva du ikke bør gjøre" : "What not to do"}
                  </h2>
                  <p className="font-body text-base text-muted-foreground leading-relaxed mt-space-3">
                    {lang === "no" 
                      ? "Ikke start med å kjøpe mange verktøy. Ikke be hver medarbeider finne opp sin egen prompting-metode. Ikke automatiser høyrisikobeslutninger først. Standardiser to eller tre arbeidsflyter og gjør dem enkle å bruke." 
                      : "Do not start by buying many tools. Do not ask every employee to invent their own prompting method. Do not automate high-risk decisions first. Standardise two or three workflows and make them easy to use."}
                  </p>
                </div>

                {/* BOTTOM CARD */}
                <div className="bg-card border border-border rounded-lg p-space-7">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {lang === "no" ? "Spørsmål som avklarer hvor du bør starte" : "Questions that clarify where to begin"}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground mt-space-1">
                    {ui.meetingSubtitle}
                  </p>
                  
                  <ul className="mt-space-4 space-y-space-3">
                    {meetingQuestions[lang].map((q, i) => (
                      <li key={i} className="flex gap-space-3 items-start">
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="font-body text-sm text-foreground leading-relaxed">
                          {q}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
        {mainTab === "builder" && (
          <AgentBuilder lang={lang} />
        )}

      </main>
      <AIAssistant lang={lang} />
      </div>
    </>
  );
}
