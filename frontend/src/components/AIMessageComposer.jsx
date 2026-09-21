import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api";
import "./AIMessageComposer.css";

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
];

const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];

const PURPOSES = [
  { value: "followup", label: "Follow-up" },
  { value: "sales", label: "Sales" },
  { value: "reminder", label: "Reminder" },
  { value: "check_in", label: "Check-in" },
  { value: "re_engagement", label: "Re-engagement" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "malayalam", label: "Malayalam" },
  { value: "manglish", label: "Manglish" },
];

const DEFAULT_OPTIONS = {
  customer: "",
  followup: "",
  tone: "friendly",
  length: "medium",
  purpose: "followup",
  language: "english",
};

function AIMessageComposer({ initialCustomer, initialFollowup, onSent }) {
  const [customers, setCustomers] = useState([]);
  const [followups, setFollowups] = useState([]);

  const [options, setOptions] = useState({
    ...DEFAULT_OPTIONS,
    customer: initialCustomer ? String(initialCustomer) : "",
    followup: initialFollowup ? String(initialFollowup) : "",
  });

  const [messageText, setMessageText] = useState("");
  const [generated, setGenerated] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState({
    generate: false,
    send: false,
  });
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [customerData, followupData] = await Promise.all([
          apiRequest("/customers/"),
          apiRequest("/followups/"),
        ]);
        setCustomers(customerData);
        setFollowups(followupData);
      } catch (err) {
        setLoadError(err.message);
      }
    }

    loadData();
  }, []);

  const availableFollowups = useMemo(
    () =>
      followups.filter(
        (item) =>
          !options.customer ||
          String(item.customer) === options.customer
      ),
    [followups, options.customer]
  );

  function setOption(name, value) {
    setOptions((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "customer") {
        next.followup = "";
      }
      return next;
    });
    setStatus(null);
  }

  function clearStatus() {
    setStatus(null);
  }

  async function handleGenerate() {
    setStatus(null);
    setGenerated(null);

    if (!options.customer) {
      setStatus({ type: "error", text: "Please select a customer." });
      return;
    }

    setLoading((prev) => ({ ...prev, generate: true }));

    try {
      const data = await apiRequest("/messages/generate/", {
        method: "POST",
        body: JSON.stringify({
          customer: Number(options.customer),
          followup: options.followup
            ? Number(options.followup)
            : null,
          tone: options.tone,
          length: options.length,
          purpose: options.purpose,
          language: options.language,
        }),
      });

      setGenerated({
        message_id: data.message_id,
        tone: data.tone,
        language: data.language,
        purpose: data.purpose,
      });
      setMessageText(data.message);
      setStatus({
        type: "success",
        text: "AI message generated. Review and edit it before sending.",
      });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  }

  async function handleSend() {
    setStatus(null);

    if (!options.customer) {
      setStatus({ type: "error", text: "Please select a customer." });
      return;
    }

    if (!messageText.trim()) {
      setStatus({
        type: "error",
        text: "Message is empty. Generate one or type a message.",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, send: true }));

    try {
      await apiRequest("/messages/send/", {
        method: "POST",
        body: JSON.stringify({
          customer: Number(options.customer),
          followup: options.followup
            ? Number(options.followup)
            : null,
          message_text: messageText,
          message_id: generated ? generated.message_id : null,
        }),
      });

      setStatus({
        type: "success",
        text: "Message sent via WhatsApp.",
      });
      setGenerated(null);

      if (onSent) {
        onSent();
      }
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, send: false }));
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus({ type: "error", text: "Could not copy the message." });
    }
  }

  return (
    <section className="amc-card">
      <div className="amc-header">
        <h2>WhatsApp AI Message</h2>
        <p>
          Generate a personalized message with AI, edit it, then send via
          WhatsApp.
        </p>
      </div>

      {loadError && <div className="amc-status amc-status-error">{loadError}</div>}

      <div className="amc-grid">
        <label className="amc-field">
          <span>Customer</span>
          <select
            value={options.customer}
            onChange={(e) => setOption("customer", e.target.value)}
          >
            <option value="">Select Customer</option>
            {customers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="amc-field">
          <span>Follow-up (optional)</span>
          <select
            value={options.followup}
            onChange={(e) => setOption("followup", e.target.value)}
            disabled={!options.customer}
          >
            <option value="">No specific follow-up</option>
            {availableFollowups.map((item) => (
              <option key={item.id} value={item.id}>
                Follow-up #{item.id}
              </option>
            ))}
          </select>
        </label>

        <label className="amc-field">
          <span>Tone</span>
          <select
            value={options.tone}
            onChange={(e) => setOption("tone", e.target.value)}
          >
            {TONES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="amc-field">
          <span>Length</span>
          <select
            value={options.length}
            onChange={(e) => setOption("length", e.target.value)}
          >
            {LENGTHS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="amc-field">
          <span>Purpose</span>
          <select
            value={options.purpose}
            onChange={(e) => setOption("purpose", e.target.value)}
          >
            {PURPOSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="amc-field">
          <span>Language</span>
          <select
            value={options.language}
            onChange={(e) => setOption("language", e.target.value)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="amc-actions">
        <button
          type="button"
          className="amc-btn amc-btn-primary"
          onClick={handleGenerate}
          disabled={loading.generate}
        >
          {loading.generate
            ? "Generating..."
            : generated
              ? "Regenerate AI Message"
              : "Generate AI Message"}
        </button>

        {generated && (
          <button
            type="button"
            className="amc-btn amc-btn-primary"
            onClick={handleGenerate}
            disabled={loading.generate}
          >
            Regenerate
          </button>
        )}
      </div>

      <label className="amc-field amc-field-textarea">
        <span>
          Message
          {generated && (
            <em className="amc-meta">
              {generated.tone} · {generated.language}
            </em>
          )}
        </span>
        <textarea
          rows="5"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Click Generate AI Message, or type a message manually."
          onFocus={clearStatus}
        />
      </label>

      {status && (
        <div
          className={
            status.type === "error"
              ? "amc-status amc-status-error"
              : "amc-status amc-status-success"
          }
        >
          {status.text}
        </div>
      )}

      <div className="amc-actions amc-actions-bottom">
        <button
          type="button"
          className="amc-btn amc-btn-secondary"
          onClick={handleCopy}
          disabled={!messageText}
        >
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          type="button"
          className="amc-btn amc-btn-send"
          onClick={handleSend}
          disabled={loading.send || !messageText.trim()}
        >
          {loading.send ? "Sending..." : "Send via WhatsApp"}
        </button>
      </div>
    </section>
  );
}

export default AIMessageComposer;