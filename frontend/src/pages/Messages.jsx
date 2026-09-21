import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import AIMessageComposer from "../components/AIMessageComposer";
import { apiRequest } from "../api";
import "./Messages.css";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const initialCustomerParam = searchParams.get("customer");
  const initialCustomer = initialCustomerParam
    ? Number(initialCustomerParam)
    : null;

  async function loadMessages() {
    try {
      const data = await apiRequest("/messages/");
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  function formatDate(date) {
    try {
      return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return date;
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "sent":
        return "status-pill status-pill-success";

      case "failed":
        return "status-pill status-pill-danger";

      case "generated":
      case "draft":
        return "status-pill status-pill-info";

      default:
        return "status-pill status-pill-default";
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar title="Messages" />

        {error && <div className="error">{error}</div>}

        <div className="messages-composer">
          <AIMessageComposer
            initialCustomer={initialCustomer}
            onSent={loadMessages}
          />
        </div>

        <div className="table-card messages-history">
          <div className="table-header">
            <div>
              <h3>Message History</h3>
              <p>
                {messages.length} message
                {messages.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="messages-empty">
              No messages yet. Generate or send your first message above.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td>{message.customer_name || message.customer}</td>
                    <td>{message.message_type}</td>
                    <td>{message.direction}</td>
                    <td>{message.message_text}</td>
                    <td>
                      <span className={getStatusClass(message.status)}>
                        {message.status}
                      </span>
                      {message.error_message && (
                        <div
                          className="status-detail"
                          title={message.error_message}
                        >
                          {message.error_message}
                        </div>
                      )}
                    </td>
                    <td>{formatDate(message.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default Messages;