import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Wrench, UserPlus, Network, BookOpen } from "lucide-react";

import { AIAssistant } from "./components/AIAssistant";
import { AgentBuilder } from "./components/AgentBuilder";
import { DynamicBriefDemo } from "./components/DynamicBriefDemo";
import { InfoCard } from "./components/InfoCard";

import { roles } from "./data/roles";
import { copy, recommendations, roadmap, meetingQuestions } from "./data/translations";

import type { Lang } from "./types";

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("employees361_lang");
    return (saved === "no" || saved === "en") ? saved : "no";
  });
  const [mainTab, setMainTab] = useState<"roles" | "perspective" | "builder">("perspective");
  const [selectedRole, setSelectedRole] = useState("meeting");
  const [selectedDepth, setSelectedDepth] = useState("overview");

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
      if (selectedRole === "insight") {
        return <DynamicBriefDemo lang={lang} />;
      }
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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
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
                onClick={() => { setLang("no"); localStorage.setItem("employees361_lang", "no"); }}
                className={`h-[36px] px-space-4 rounded-full font-body text-sm font-medium transition-colors ${
                  lang === "no"
                    ? "bg-terracotta text-terracotta-foreground"
                    : "text-foreground hover:bg-border"
                }`}
              >
                {ui.norwegian}
              </button>
              <button
                onClick={() => { setLang("en"); localStorage.setItem("employees361_lang", "en"); }}
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
          <section className="space-y-space-6 animate-in fade-in duration-500">
            <div className="space-y-space-2">
              <h2 className="font-display text-3xl font-medium tracking-headline text-foreground">
                {ui.perspectiveTitle}
              </h2>
              <p className="font-body text-base text-muted-foreground max-w-prose">
                {ui.perspectiveSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-5">
              {ui.perspectiveBlocks.map((block: any, i: number) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? "bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-3"
                      : "bg-card border border-border rounded-lg p-space-6 space-y-space-3"
                  }
                >
                  <h3
                    className={`font-display text-xl font-medium tracking-headline ${
                      i === 0 ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {block.title}
                  </h3>
                  <p
                    className={`font-body text-base leading-reading ${
                      i === 0 ? "opacity-90" : "text-muted-foreground"
                    }`}
                  >
                    {block.body}
                  </p>
                </div>
              ))}
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
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-4">
                <div className="space-y-space-2">
                  <h2 className="font-display text-3xl font-medium tracking-headline text-foreground">
                    {ui.sectionsTitle}
                  </h2>
                  <p className="font-body text-base text-muted-foreground max-w-prose">
                    {ui.sectionsSubtitle}
                  </p>
                </div>
                {/* Depth Tabs */}
                <div className="flex flex-wrap gap-space-2">
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
                        : "bg-card border-border text-foreground hover:bg-border"
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
              {/* Recommendations */}
              <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-6">
                <div className="space-y-space-2">
                  <h2 className="font-display text-2xl font-medium tracking-headline text-foreground">
                    {ui.recsTitle}
                  </h2>
                  <p className="font-body text-sm text-muted-foreground leading-reading">
                    {ui.recsSubtitle}
                  </p>
                </div>
                <div className="space-y-space-5">
                  {recommendations[lang].map((rec, i) => (
                    <div key={i} className="space-y-space-1">
                      <h4 className="font-display text-lg font-medium text-foreground">
                        {rec.title}
                      </h4>
                      <p className="font-body text-sm text-muted-foreground leading-reading">
                        {rec.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap & Meeting Questions */}
              <div className="space-y-space-6">
                {/* Roadmap */}
                <div className="bg-card border border-border rounded-lg p-space-6 space-y-space-6">
                  <div className="space-y-space-2">
                    <h2 className="font-display text-2xl font-medium tracking-headline text-foreground">
                      {ui.roadmapTitle}
                    </h2>
                    <p className="font-body text-sm text-muted-foreground leading-reading">
                      {ui.roadmapSubtitle}
                    </p>
                  </div>
                  <div className="relative border-l border-border ml-space-4 space-y-space-6 py-space-2">
                    {roadmap[lang].map((phase, i) => (
                      <div key={i} className="relative pl-space-6">
                        <div className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border font-body text-sm font-medium text-foreground">
                          {i + 1}
                        </div>
                        <h4 className="font-display text-lg font-medium text-foreground pt-1">
                          {phase.title}
                        </h4>
                        <p className="font-body text-sm text-muted-foreground leading-reading mt-space-1">
                          {phase.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meeting Questions */}
                <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-5">
                  <div className="space-y-space-2">
                    <h2 className="font-display text-2xl font-medium tracking-headline text-accent">
                      {ui.meetingTitle}
                    </h2>
                    <p className="font-body text-sm opacity-90 leading-reading">
                      {ui.meetingSubtitle}
                    </p>
                  </div>
                  <ul className="space-y-space-3">
                    {meetingQuestions[lang].map((q, i) => (
                      <li key={i} className="flex gap-space-3 items-start">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="font-body text-sm leading-reading">
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
  );
}
