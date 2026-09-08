import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

function Messages() {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await apiRequest("/messages/");
        setMessages(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadMessages();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar title="Messages" />

        {error && <div className="error">{error}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Direction</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>{message.customer}</td>
                  <td>{message.direction}</td>
                  <td>{message.message_text}</td>
                  <td>{message.status}</td>
                  <td>{new Date(message.created_at).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default Messages;