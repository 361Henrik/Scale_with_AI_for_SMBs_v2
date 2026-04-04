import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Mic, Square, Send, Zap, Brain, Sparkles } from "lucide-react";
import { ai } from "../lib/gemini";
import { ThinkingLevel } from "@google/genai";
import type { Lang, Message, Mode } from "../types";

export function AIAssistant({ lang }: { lang: Lang }) {
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
          if (base64data) {
            await transcribeAudio(base64data, 'audio/webm');
          }
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
              <h3 className="font-display text-lg font-medium tracking-headline">Ascension AI</h3>
              <p className="font-body text-xs opacity-80">Din tenkepartner</p>
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
