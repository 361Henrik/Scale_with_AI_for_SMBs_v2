import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, X, Send, Zap, Loader2, Users, Sliders } from "lucide-react";
import { ai } from "../lib/gemini";
import { agentsByCategory, categories, skillSuggestions, skillGroups } from "../data/agents";
import type { Lang, SelectedAgent } from "../types";

export function AgentBuilder({ lang }: { lang: Lang }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<SelectedAgent | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [agentFinderInput, setAgentFinderInput] = useState("");
  const [isFindingAgent, setIsFindingAgent] = useState(false);
  const [agentFinderResult, setAgentFinderResult] = useState<any>(null);
  const [agentFinderError, setAgentFinderError] = useState(false);

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [agentDescription, setAgentDescription] = useState<string | null>(null);
  const [agentDescriptionError, setAgentDescriptionError] = useState(false);

  const [agentImage, setAgentImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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

  useEffect(() => {
    if (stepIndex === 2 && selectedAgent) {
      setSelectedSkills(selectedAgent.baseSkills);
    }
  }, [stepIndex, selectedAgent]);

  useEffect(() => {
    if (stepIndex === 3 && selectedAgent) {
      Promise.all([generateAgentDescription(), generateAgentImage()]);
    }
  }, [stepIndex]);

  const buildImagenPrompt = (category: string): string => {
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
      const categoryName = categories.find(c => c.id === selectedCategory)?.no.title || "";
      const prompt = buildImagenPrompt(categoryName);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } },
      });
      let imageData = null;
      if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) { imageData = part.inlineData.data; break; }
        }
      }
      if (imageData) { setAgentImage(`data:image/png;base64,${imageData}`); }
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
        config: { responseMimeType: "application/json" }
      });
      let result;
      try {
        result = JSON.parse(response.text || "{}");
      } catch {
        console.error("Failed to parse agent finder response");
        setAgentFinderError(true);
        return;
      }
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
      const categoryName = categories.find(c => c.id === selectedCategory)?.[lang].title || "";
      const prompt = `
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
      const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
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
      const categoryName = categories.find(c => c.id === selectedCategory)?.[lang].title || "";
      const prompt = `
Du er en ekspert på AI-implementering for norske SMB-er.
Kontekst: Brukeren har konfigurert følgende agent:
- Navn: ${selectedAgent.name}, Kategori: ${categoryName}
- Ferdigheter: ${selectedSkills.join(', ')}
- Kontrollmodus: ${selectedAgent.mode}

Spørsmål: "${qaInput}"

Svar konsist (maks 3 setninger), praktisk og på norsk. Unngå teknisk jargong.
`;
      const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
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
        if (cat) { setSelectedCategory(cat.id); }
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
      {/* STEP INDICATOR */}
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

      {/* HUMAN-IN-THE-LOOP PANEL */}
      <div className="bg-card border border-border rounded-lg p-space-5 mb-space-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* STEP 0: CATEGORY */}
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
                  <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-accent' : 'text-terracotta'}`} />
                  <h4 className="font-display font-medium text-[16px] mb-1">{cat[lang].title}</h4>
                  <p className={`font-body text-[13px] ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
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

      {/* STEP 1: AGENT TYPE */}
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
                      <h4 className="font-display font-medium text-[16px]">{agent.name[lang]}</h4>
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
                    <p className={`font-body text-[13px] ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
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

          {/* AGENT FINDER */}
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
                  <p className="font-body text-sm text-foreground">{agentFinderResult.bestMatch.reason}</p>
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
                    <p className="font-body text-[13px] text-muted-foreground">{agentFinderResult.alternativeMatch.reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* NAVIGATION */}
          <div className="flex justify-between items-center mt-space-6">
            <button
              onClick={() => { setStepIndex(0); setSelectedAgent(null); }}
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

      {/* STEP 2: SKILLS */}
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
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))} />
                    </span>
                  ))}
                </div>
              )}
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

      {/* STEP 3: SUMMARY */}
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

            {/* IMAGE */}
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
                <span className="font-body text-sm text-muted-foreground" />
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
              ) : null}
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
