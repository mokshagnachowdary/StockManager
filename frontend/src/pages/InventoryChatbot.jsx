import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an intelligent assistant built into an Inventory Management System. Your job is to guide users through the app and help them use it effectively.

The app has these main sections:
- **Dashboard** (/dashboard) — Overview of total items, active locations, low stock alerts, and recent transactions.
- **Inventory** (/inventory) — View all stock levels across locations. Filter by item or location. See low-stock alerts.
- **Items** (/items) — Manage product catalog: add, edit, deactivate items with SKU, category, unit price, reorder levels.
- **Locations** (/locations) — Manage warehouse/storage locations: add, edit, activate/deactivate locations.
- **Categories** (/categories) — Organize items into categories for easier filtering.
- **Transactions** (/transactions) — Log stock movements: INBOUND (restock), OUTBOUND (usage/sale), ADJUSTMENT (corrections), TRANSFER (between locations).
- **Update Stock** — Use the POST /v1/inventory/update endpoint to log a transaction. Requires: itemId, locationId, transactionType, quantity, performedBy.

How to help users:
- If they seem lost, ask what they're trying to do and guide them step by step.
- If they ask how to add stock, explain the Update Stock flow with transactionType: INBOUND.
- If they ask about low stock, direct them to Dashboard → Low Stock Alerts or Inventory → /alerts/low-stock.
- If they ask about a specific page, give a clear walkthrough of what's on that page.
- Keep answers concise, practical, and friendly. Use bullet points for steps.
- If they ask something unrelated to the inventory app, gently steer back.

Tone: helpful, direct, no fluff. Like a knowledgeable colleague sitting next to them.`;

const SUGGESTED_QUESTIONS = [
  "How do I add new stock?",
  "Where do I see low stock alerts?",
  "How do I add a new item?",
  "What does the Dashboard show?",
  "How do I transfer stock between locations?",
];

function BotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="6" width="14" height="10" rx="3" fill="currentColor" opacity="0.15"/>
      <rect x="3" y="6" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="11" r="1.2" fill="currentColor"/>
      <path d="M10 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="2.5" r="1" fill="currentColor"/>
      <path d="M7 16v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 16v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#6366f1",
            opacity: 0.7,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 10,
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            flexShrink: 0,
          }}
        >
          <BotIcon />
        </div>
      )}
      <div
        style={{
          maxWidth: "75%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "#f1f5f9",
          color: isUser ? "white" : "#1e293b",
          fontSize: 13.5,
          lineHeight: 1.55,
          boxShadow: isUser
            ? "0 2px 8px rgba(99,102,241,0.3)"
            : "0 1px 3px rgba(0,0,0,0.08)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/^- (.+)$/gm, "• $1")
            .replace(/\n/g, "<br/>"),
        }}
      />
    </div>
  );
}

export default function InventoryChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm your inventory assistant. I can walk you through any part of this app — adding stock, managing items, reading your dashboard, or anything else.\n\nWhat would you like help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      const reply =
        data.content?.[0]?.text || "Sorry, I couldn't get a response.";

      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Hmm, I couldn't connect right now. Check your network and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
          zIndex: 9999,
          transition: "transform 0.2s, box-shadow 0.2s",
          color: "white",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.55)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.45)";
        }}
        title="Open inventory assistant"
      >
        {open ? <CloseIcon /> : <BotIcon />}
        {!open && hasUnread && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#f43f5e",
              border: "2px solid white",
            }}
          />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 96,
            right: 28,
            width: 360,
            height: 520,
            borderRadius: 20,
            background: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9998,
            overflow: "hidden",
            animation: "slideUp 0.25s ease",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .chat-input:focus { outline: none; }
            .chat-input::placeholder { color: #94a3b8; }
            .suggestion-btn:hover { background: #ede9fe !important; color: #5b21b6 !important; }
          `}</style>

          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <BotIcon />
            </div>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                Inventory Assistant
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#4ade80",
                  }}
                />
                Online · Ask me anything
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}

            {/* Suggestions */}
            {showSuggestions && (
              <div style={{ marginTop: 4, marginBottom: 4 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    marginBottom: 8,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Quick questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTED_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      className="suggestion-btn"
                      onClick={() => sendMessage(q)}
                      style={{
                        background: "#f5f3ff",
                        border: "1px solid #e0d9ff",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 12.5,
                        color: "#6d28d9",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.15s, color 0.15s",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 4 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  <BotIcon />
                </div>
                <div
                  style={{
                    background: "#f1f5f9",
                    padding: "10px 14px",
                    borderRadius: "18px 18px 18px 4px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: 8,
              background: "white",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about the app..."
              rows={1}
              style={{
                flex: 1,
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                padding: "9px 12px",
                fontSize: 13.5,
                resize: "none",
                fontFamily: "inherit",
                color: "#1e293b",
                background: "#f8fafc",
                transition: "border-color 0.2s",
                lineHeight: 1.5,
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background:
                  input.trim() && !loading
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "#e2e8f0",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: input.trim() && !loading ? "white" : "#94a3b8",
                flexShrink: 0,
                alignSelf: "flex-end",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
