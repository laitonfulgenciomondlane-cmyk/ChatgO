import { useState, useRef, useEffect } from "react";
import {
  Send, Shield, Mic, ThumbsUp, ThumbsDown, Share2, Check, Copy, Volume2,
  MoreHorizontal, AudioLines, Menu, X, MessageSquarePlus, MessageSquare,
  Settings as SettingsIcon, Eye, EyeOff, ArrowLeft, LogOut, User, Globe, CreditCard, Paperclip,
} from "lucide-react";

/* ---------- IA ---------- */
const SYSTEM_PROMPT = `Você é o ChatGó, um assistente de IA completo: ajuda a criar apps, vídeos e imagens, mas também é competente e profissional em conversa geral, escrita (inclusive letras de música originais), marketing e qualquer outro assunto que o usuário trouxer.
Regras de personalidade:
- Nunca minta ou finja certeza que não tem. Se não sabe algo, diga.
- Tom direto, amigável e profissional — nunca mandão ou arrogante.
- Quando o pedido for sobre criar um app/vídeo/imagem, faça UMA pergunta de cada vez para não sobrecarregar o usuário. Em outros assuntos, responda direto.
- Não limite suas respostas a poucas linhas. Quando o assunto pedir, explique de verdade, com profundidade e exemplos. Só seja breve quando a pergunta for realmente simples.
- Evite repetir a mesma estrutura de resposta sempre — cada conversa deve soar original.
Regra de marca d'água: todo app, vídeo ou imagem criado leva a marca "LP" por padrão. Só remova a marca se o usuário pedir isso explicitamente numa mensagem — nunca por conta própria.`;

const STARTER = { role: "assistant", content: "Olá! Como posso te ajudar hoje? Me conta: que tipo de app você quer criar?" };

const ink = "#F2F4F7", inkLo = "#8A93A6", line = "#232A38", panel = "#131822", panel2 = "#171D29", void_ = "#0B0E14", gold = "#E8B84B", cyan = "#5EC8D8", coral = "#E8735F";

/* ---------- APP RAIZ ---------- */
export default function App() {
  const [screen, setScreen] = useState("auth"); // auth | chat | settings
  const [account, setAccount] = useState(null);
  const [plan, setPlan] = useState("free");

  if (screen === "auth") return <AuthScreen onAuth={(email) => { setAccount({ email }); setScreen("chat"); }} />;
  if (screen === "settings")
    return (
      <SettingsScreen
        account={account}
        plan={plan}
        setPlan={setPlan}
        onBack={() => setScreen("chat")}
        onLogout={() => { setAccount(null); setScreen("auth"); }}
      />
    );
  return <ChatScreen account={account} plan={plan} onOpenSettings={() => setScreen("settings")} />;
}

/* ---------- TELA: LOGIN / CRIAR CONTA ---------- */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // No projeto real: supabase.auth.signUp / signInWithPassword({ email, password })
    setTimeout(() => { setLoading(false); onAuth(email || "usuario@chatgo.app"); }, 500);
  }

  function handleSocial(provider) {
    // No projeto real: supabase.auth.signInWithOAuth({ provider })
    onAuth(`conta-${provider}@chatgo.app`);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: void_, color: ink, fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center font-semibold text-lg">
          <span className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold" style={{ background: gold, color: "#1a1400" }}>LP</span>
          ChatGó
        </div>

        <h1 className="text-xl font-semibold mb-1">{mode === "signup" ? "Criar conta" : "Entrar"}</h1>
        <p className="text-sm mb-6" style={{ color: inkLo }}>{mode === "signup" ? "Leva menos de um minuto." : "Bom te ver de novo."}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" required placeholder="seu@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: panel, border: `1px solid ${line}`, color: ink }}
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} required minLength={6} placeholder="Senha" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none"
              style={{ background: panel, border: `1px solid ${line}`, color: ink }}
            />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Mostrar senha">
              {showPassword ? <EyeOff size={16} color={inkLo} /> : <Eye size={16} color={inkLo} />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50" style={{ background: gold, color: "#1a1400" }}>
            {loading ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: line }} />
          <span className="text-xs" style={{ color: inkLo }}>ou</span>
          <div className="flex-1 h-px" style={{ background: line }} />
        </div>

        <div className="space-y-2.5">
          <button onClick={() => handleSocial("google")} className="w-full rounded-xl py-2.5 text-sm font-medium" style={{ background: panel, border: `1px solid ${line}`, color: ink }}>Continuar com Google</button>
          <button onClick={() => handleSocial("facebook")} className="w-full rounded-xl py-2.5 text-sm font-medium" style={{ background: panel, border: `1px solid ${line}`, color: ink }}>Continuar com Facebook</button>
          <button onClick={() => handleSocial("apple")} className="w-full rounded-xl py-2.5 text-sm font-medium" style={{ background: panel, border: `1px solid ${line}`, color: ink }}>Continuar com Apple</button>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: inkLo }}>
          {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="underline" style={{ color: cyan }}>
            {mode === "signup" ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ---------- TELA: CONFIGURAÇÕES ---------- */
function SettingsScreen({ account, plan, setPlan, onBack, onLogout }) {
  const Row = ({ icon, label, value, action }) => (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: line }}>
      {icon}
      <div className="flex-1">
        <div className="text-sm">{label}</div>
        {value && <div className="text-xs mt-0.5" style={{ color: inkLo }}>{value}</div>}
      </div>
      {action}
    </div>
  );

  return (
    <div className="min-h-screen w-full" style={{ background: void_, color: ink, fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: line }}>
        <button onClick={onBack} aria-label="Voltar"><ArrowLeft size={18} color={inkLo} /></button>
        <span className="font-semibold">Configurações</span>
      </div>

      <div className="px-4 pt-5 pb-2 text-xs uppercase tracking-wide" style={{ color: inkLo, fontFamily: "'JetBrains Mono', monospace" }}>Conta</div>
      <Row icon={<User size={17} color={inkLo} />} label={account?.email || "usuário"} value="Editar perfil" />
      <Row icon={<CreditCard size={17} color={inkLo} />} label="Plano" value={plan === "pro" ? "PRO — personalização completa" : "Free — 1 vídeo/desenho por dia"}
        action={
          <button onClick={() => setPlan(plan === "free" ? "pro" : "free")} className="text-xs px-2.5 py-1 rounded-md font-semibold" style={{ background: plan === "pro" ? gold : line, color: plan === "pro" ? "#1a1400" : inkLo }}>
            {plan === "pro" ? "PRO" : "mudar"}
          </button>
        }
      />

      <div className="px-4 pt-5 pb-2 text-xs uppercase tracking-wide" style={{ color: inkLo, fontFamily: "'JetBrains Mono', monospace" }}>Preferências</div>
      <Row icon={<Globe size={17} color={inkLo} />} label="Idioma" value="Português (BR)" />
      <Row icon={<SettingsIcon size={17} color={inkLo} />} label="Marca d'água (LP)" value="Ativa por padrão — só sai se você pedir numa mensagem" />

      <div className="px-4 pt-6">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium" style={{ background: panel, border: `1px solid ${line}`, color: coral }}>
          <LogOut size={15} /> Sair da conta
        </button>
      </div>
    </div>
  );
}

/* ---------- TELA: CHAT ---------- */
function ChatScreen({ account, plan, onOpenSettings }) {
  const [messages, setMessages] = useState([STARTER]);
  const [historico, setHistorico] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState("alta");
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [anexo, setAnexo] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Seu navegador não suporta entrada por voz. No app final isso funciona nativo no celular."); return; }
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SpeechRecognition();
    rec.lang = "pt-BR";
    rec.interimResults = true;
    rec.continuous = true;
    const baseInput = input;
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(baseInput ? `${baseInput} ${transcript}` : transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  function rate(idx, value) { setFeedback((prev) => ({ ...prev, [idx]: prev[idx] === value ? null : value })); }
  function copyMessage(idx, content) { navigator.clipboard?.writeText(content).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 1500); }); }
  function speakMessage(idx, content) {
    if (!window.speechSynthesis) { alert("Seu navegador não suporta leitura em voz alta."); return; }
    if (speakingIdx === idx) { window.speechSynthesis.cancel(); setSpeakingIdx(null); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(content);
    utter.lang = "pt-BR";
    utter.onend = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  }
  function shareMessage(content) { if (navigator.share) navigator.share({ text: content }).catch(() => {}); else copyMessage(-1, content); }

  function novoChat() {
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg) {
      const titulo = firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "…" : "");
      setHistorico((prev) => [{ titulo, messages }, ...prev]);
    }
    setMessages([STARTER]);
    setSidebarOpen(false);
  }
  function abrirConversa(item) { setMessages(item.messages); setSidebarOpen(false); }

  async function send() {
    const text = input.trim();
    if ((!text && !anexo) || loading) return;
    const nextMessages = [...messages, { role: "user", content: anexo ? `${text} [anexo: ${anexo.nome}]`.trim() : text }];
    setMessages(nextMessages);
    setInput("");
    setAnexo(null);
    setLoading(true);
    const heavy = /vídeo|video|animação|animacao|10 minutos|longo/i.test(text);
    setConfidence(heavy ? "média" : "alta");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2000, system: SYSTEM_PROMPT, messages: nextMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await resp.json();
      const textBlock = data?.content?.find((c) => c.type === "text");
      setMessages((prev) => [...prev, { role: "assistant", content: textBlock?.text || "Não consegui gerar uma resposta agora — tenta de novo?" }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Deu erro pra falar com o servidor. Isso é real, não vou esconder — tenta reenviar." }]);
    } finally { setLoading(false); }
  }

  function onKeyDown(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }

  function onFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnexo({ nome: file.name, url: URL.createObjectURL(file), tipo: file.type });
    e.target.value = "";
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative" style={{ background: void_, color: ink, fontFamily: "Inter, sans-serif" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="w-72 h-full flex flex-col" style={{ background: "#0F131C", borderRight: `1px solid ${line}` }}>
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-2 font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: gold, color: "#1a1400" }}>LP</span>
                ChatGó
              </div>
              <button onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={18} color={inkLo} /></button>
            </div>
            <div className="px-3">
              <button onClick={novoChat} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-1" style={{ background: panel2, color: ink }}>
                <MessageSquarePlus size={16} /> Novo chat
              </button>
            </div>
            <div className="px-4 pt-5 pb-2 text-xs uppercase tracking-wide" style={{ color: inkLo, fontFamily: "'JetBrains Mono', monospace" }}>Conversas</div>
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {historico.length === 0 ? (
                <p className="px-3 py-2 text-xs" style={{ color: "#5b6274" }}>Suas conversas anteriores vão aparecer aqui.</p>
              ) : (
                historico.map((item, idx) => (
                  <button key={idx} onClick={() => abrirConversa(item)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left" style={{ color: "#C7CCD6" }}>
                    <MessageSquare size={14} style={{ flexShrink: 0, color: inkLo }} />
                    <span className="truncate">{item.titulo}</span>
                  </button>
                ))
              )}
            </div>
            <button onClick={onOpenSettings} className="px-3 py-3 border-t flex items-center gap-2.5" style={{ borderColor: line }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: line, color: ink }}>
                {(account?.email?.[0] || "U").toUpperCase()}
              </div>
              <span className="text-sm flex-1 text-left truncate">{account?.email || "Minha conta"}</span>
              <SettingsIcon size={16} color={inkLo} />
            </button>
          </div>
          <div className="flex-1" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 border-b" style={{ background: panel, borderColor: line }}>
        <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={18} color={inkLo} /></button>
        <div className="flex items-center gap-2 mr-auto font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold" style={{ background: gold, color: "#1a1400" }}>LP</span>
          ChatGó
        </div>
        <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: plan === "pro" ? gold : line, color: plan === "pro" ? "#1a1400" : inkLo, fontFamily: "'JetBrains Mono', monospace" }}>
          plano {plan === "pro" ? "PRO" : "free"}
        </span>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: inkLo, fontFamily: "'JetBrains Mono', monospace" }}>
          <Shield size={13} /> confiança: <b style={{ color: ink }}>{confidence}</b>
        </div>
      </div>

      {plan === "free" && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: panel, border: `1px solid ${line}`, color: inkLo }}>
          Plano free: 1 vídeo ou desenho animado por dia, com personalização básica.
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl w-full mx-auto space-y-4">
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: "85%", marginLeft: m.role === "user" ? "auto" : 0, marginRight: m.role === "assistant" ? "auto" : 0 }}>
            <div className="text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap"
              style={m.role === "assistant" ? { background: panel, borderBottomLeftRadius: 4 } : { background: "transparent", border: `1px solid ${line}`, borderBottomRightRadius: 4 }}>
              {m.content}
            </div>
            {m.role === "assistant" && (
              <div className="flex items-center gap-3 mt-1.5 pl-1">
                <button onClick={() => copyMessage(i, m.content)} aria-label="Copiar"> {copiedIdx === i ? <Check size={13} color={cyan} /> : <Copy size={13} color={inkLo} />}</button>
                <button onClick={() => rate(i, "up")} aria-label="Boa resposta"><ThumbsUp size={13} color={feedback[i] === "up" ? cyan : inkLo} fill={feedback[i] === "up" ? cyan : "none"} /></button>
                <button onClick={() => rate(i, "down")} aria-label="Resposta ruim"><ThumbsDown size={13} color={feedback[i] === "down" ? coral : inkLo} fill={feedback[i] === "down" ? coral : "none"} /></button>
                <button onClick={() => speakMessage(i, m.content)} aria-label="Ouvir"><Volume2 size={13} color={speakingIdx === i ? cyan : inkLo} /></button>
                <button onClick={() => shareMessage(m.content)} aria-label="Compartilhar"><Share2 size={13} color={inkLo} /></button>
                <button aria-label="Mais opções"><MoreHorizontal size={13} color={inkLo} /></button>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="max-w-[85%] text-sm px-3.5 py-2.5 rounded-2xl" style={{ background: panel, color: inkLo, borderBottomLeftRadius: 4 }}>digitando…</div>}
        <div ref={scrollRef} />
      </div>

      <div className="border-t px-4 py-3" style={{ borderColor: line }}>
        <div className="max-w-2xl mx-auto">
          {anexo && (
            <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: panel, border: `1px solid ${line}`, color: inkLo }}>
              {anexo.tipo?.startsWith("image/") && <img src={anexo.url} alt="" className="w-8 h-8 rounded object-cover" />}
              <span className="truncate flex-1">{anexo.nome}</span>
              <button onClick={() => setAnexo(null)} aria-label="Remover anexo"><X size={13} color={inkLo} /></button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFileSelected} />
            <button onClick={() => fileInputRef.current?.click()} aria-label="Anexar da galeria" className="rounded-xl p-2.5 mb-1" style={{ background: panel, border: `1px solid ${line}`, color: ink }}>
              <Paperclip size={16} />
            </button>
            <div className="flex-1 rounded-2xl px-4 pt-3 pb-2" style={{ background: panel, border: `1px solid ${listening ? cyan : line}`, minHeight: 76 }}>
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={listening ? "Ouvindo… fale à vontade" : "Escreva sua resposta…"}
                className="w-full resize-none outline-none text-sm bg-transparent"
                style={{ color: ink, minHeight: 40 }}
              />
              {listening && <div className="text-xs mt-1 flex items-center gap-1.5" style={{ color: cyan }}><AudioLines size={12} /> transcrevendo em tempo real…</div>}
            </div>
            <button onClick={toggleMic} aria-label="Falar em vez de digitar" className="rounded-xl p-2.5 mb-1" style={{ background: listening ? coral : panel, border: `1px solid ${line}`, color: listening ? void_ : ink }}><Mic size={16} /></button>
            <button aria-label="Modo de conversa por voz" className="rounded-full p-2.5 mb-1" style={{ background: cyan, color: void_ }}><AudioLines size={16} /></button>
            <button onClick={send} disabled={loading || (!input.trim() && !anexo)} className="rounded-xl p-2.5 mb-1 disabled:opacity-40" style={{ background: gold, color: "#1a1400" }}><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
