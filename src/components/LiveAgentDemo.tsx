import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Check, X, RotateCcw, Shield } from "lucide-react";
import {
  claude,
  CLAUDE_MODEL,
  hasClaudeKey,
  parseSections,
  ROLE_DEMOS,
  type RoleKey,
} from "../lib/claude";

type Lang = "no" | "en";
type Status = "idle" | "streaming" | "done" | "approved" | "rejected" | "error";

export function LiveAgentDemo({
  roleKey,
  lang,
}: {
  roleKey: string;
  lang: Lang;
}) {
  // Guard against unknown role keys — fall back to meeting
  const validKey: RoleKey =
    roleKey === "meeting" ||
    roleKey === "document" ||
    roleKey === "content" ||
    roleKey === "customer" ||
    roleKey === "reporting" ||
    roleKey === "onboarding"
      ? roleKey
      : "meeting";

  const demo = ROLE_DEMOS[validKey];
  const [input, setInput] = useState(demo.sampleInput[lang]);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset the demo when the role or language changes
  useEffect(() => {
    setInput(demo.sampleInput[lang]);
    setOutput("");
    setStatus("idle");
    setErrorMsg(null);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, [validKey, lang, demo]);

  const sections = useMemo(() => parseSections(output), [output]);

  async function runDemo() {
    if (!hasClaudeKey()) {
      setStatus("error");
      setErrorMsg(
        lang === "no"
          ? "AI-forhåndsvisning krever ANTHROPIC_API_KEY i .env.local. Demo-teksten er lagt til som eksempel, men live-generering er ikke tilgjengelig."
          : "AI preview requires ANTHROPIC_API_KEY in .env.local. The sample text is shown as an example, but live generation is not available.",
      );
      return;
    }

    setStatus("streaming");
    setOutput("");
    setErrorMsg(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const stream = claude.messages.stream(
        {
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          system: demo.system(lang),
          messages: [
            {
              role: "user",
              content: demo.buildUser(input, lang),
            },
          ],
        },
        { signal: controller.signal },
      );

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          const deltaText = event.delta.text;
          setOutput((prev) => prev + deltaText);
        }
      }

      await stream.finalMessage();
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) {
        // user reset — don't show an error
        return;
      }
      console.error("Claude demo error:", err);
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === "no"
            ? "Noe gikk galt under kjøringen."
            : "Something went wrong during the run.",
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function reset() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setInput(demo.sampleInput[lang]);
    setOutput("");
    setStatus("idle");
    setErrorMsg(null);
  }

  const isBusy = status === "streaming";
  const hasOutput = output.trim().length > 0;

  return (
    <div className="space-y-space-5">
      {/* Eyebrow + explainer */}
      <div className="flex items-start justify-between gap-space-4 flex-wrap">
        <div>
          <div className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {lang === "no" ? "Live demo — Claude-drevet" : "Live demo — powered by Claude"}
          </div>
          <p className="font-body text-sm text-muted-foreground leading-reading mt-1 max-w-[52ch]">
            {lang === "no"
              ? "Prøv agenten på ekte data. Rediger input, kjør agenten, og godkjenn eller avvis utfallet — akkurat som en operatør ville gjort i produksjon."
              : "Try the agent on real input. Edit the input, run the agent, and approve or reject the result — just like an operator would in production."}
          </p>
        </div>
      </div>

      {/* Input card */}
      <div className="bg-card border border-border rounded-lg p-space-5 space-y-space-3">
        <div className="flex items-center justify-between">
          <div className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {lang === "no" ? "Input til agenten" : "Input to the agent"}
          </div>
          <span className="font-body text-xs text-muted-foreground">
            {demo.inputHint[lang]}
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isBusy}
          rows={Math.min(14, Math.max(5, input.split("\n").length + 1))}
          className="w-full bg-background border border-border rounded-lg px-space-3 py-space-3 font-body text-sm text-foreground leading-reading focus:outline-none focus:ring-1 focus:ring-primary resize-y disabled:opacity-60"
        />
        <div className="flex items-center gap-space-3 flex-wrap">
          <button
            onClick={runDemo}
            disabled={isBusy || input.trim().length === 0}
            className="h-[44px] px-space-5 bg-terracotta text-terracotta-foreground rounded-lg font-body text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-space-2"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {lang === "no" ? "Kjører agent..." : "Running agent..."}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {demo.runLabel[lang]}
              </>
            )}
          </button>
          {(hasOutput || status === "error") && (
            <button
              onClick={reset}
              className="h-[44px] px-space-4 bg-background border border-border text-foreground rounded-lg font-body text-sm font-medium hover:bg-card transition-colors flex items-center gap-space-2"
            >
              <RotateCcw className="w-4 h-4" />
              {lang === "no" ? "Tilbakestill" : "Reset"}
            </button>
          )}
          <div className="font-body text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            {lang === "no" ? "Claude Opus 4.6 · streaming" : "Claude Opus 4.6 · streaming"}
          </div>
        </div>
      </div>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <div className="bg-card border-l-4 border-terracotta rounded-lg p-space-4">
          <div className="font-body text-xs font-medium uppercase tracking-wider text-terracotta mb-1">
            {lang === "no" ? "Demo ikke tilgjengelig" : "Demo unavailable"}
          </div>
          <p className="font-body text-sm text-foreground leading-reading">
            {errorMsg}
          </p>
        </div>
      )}

      {/* Streaming / result output */}
      {(isBusy || hasOutput) && (
        <div className="bg-primary text-primary-foreground rounded-lg p-space-6 space-y-space-4">
          <div className="flex items-center justify-between">
            <div className="font-body text-xs font-medium uppercase tracking-wider text-accent">
              {lang === "no" ? "Agentens resultat" : "Agent result"}
            </div>
            {isBusy && (
              <div className="flex items-center gap-1 font-body text-xs text-accent">
                <Loader2 className="w-3 h-3 animate-spin" />
                {lang === "no" ? "Tenker..." : "Thinking..."}
              </div>
            )}
          </div>

          {sections.length > 0 ? (
            <div className="space-y-space-4">
              {sections.map((s, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-lg p-space-4"
                >
                  <h4 className="font-display text-base font-medium text-accent tracking-headline mb-space-2">
                    {s.title}
                  </h4>
                  <div className="font-body text-sm text-primary-foreground/90 leading-reading whitespace-pre-wrap">
                    {s.body || (isBusy ? "…" : "")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="font-body text-sm text-primary-foreground/80 leading-reading whitespace-pre-wrap">
              {output || "…"}
            </div>
          )}

          {/* Human-in-charge confirm/reject */}
          {(status === "done" || status === "approved" || status === "rejected") && (
            <div className="pt-space-3 border-t border-white/15">
              <div className="font-body text-xs font-medium uppercase tracking-wider text-accent mb-space-3">
                {lang === "no" ? "Menneske i førersetet" : "Human in charge"}
              </div>
              {status === "approved" ? (
                <div className="flex items-center gap-space-2 font-body text-sm text-accent">
                  <Check className="w-4 h-4" />
                  {lang === "no"
                    ? "Godkjent. Agenten ville nå utført handlingen (send, lagre, varsle)."
                    : "Approved. The agent would now execute the action (send, save, notify)."}
                </div>
              ) : status === "rejected" ? (
                <div className="flex items-center gap-space-2 font-body text-sm text-primary-foreground/80">
                  <X className="w-4 h-4" />
                  {lang === "no"
                    ? "Avvist. Agenten stopper og venter på ny instruksjon."
                    : "Rejected. The agent stops and waits for new instruction."}
                </div>
              ) : (
                <div className="flex gap-space-3">
                  <button
                    onClick={() => setStatus("approved")}
                    className="h-[40px] px-space-4 bg-accent text-primary rounded-lg font-body text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-space-2"
                  >
                    <Check className="w-4 h-4" />
                    {lang === "no" ? "Godkjenn" : "Approve"}
                  </button>
                  <button
                    onClick={() => setStatus("rejected")}
                    className="h-[40px] px-space-4 bg-white/10 text-primary-foreground border border-white/20 rounded-lg font-body text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-space-2"
                  >
                    <X className="w-4 h-4" />
                    {lang === "no" ? "Avvis" : "Reject"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state (first load) */}
      {!isBusy && !hasOutput && status === "idle" && (
        <div className="bg-background border border-dashed border-border rounded-lg p-space-5">
          <p className="font-body text-sm text-muted-foreground leading-reading">
            {lang === "no"
              ? "Klikk «Kjør agent»-knappen for å se agenten jobbe i sanntid. Svaret strømmes token for token, og du får godkjenne eller avvise det til slutt — akkurat som i en ekte produksjonsløsning."
              : "Click the \u00abRun agent\u00bb button to see the agent work in real time. The response streams token by token, and you can approve or reject it at the end — just like in a real production setup."}
          </p>
        </div>
      )}
    </div>
  );
}
