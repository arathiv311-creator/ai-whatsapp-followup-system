import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

function Dashboard() {
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiRequest("/dashboard/stats/");
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    }

    loadStats();
  }, []);

  const cards = [
    ["Total Customers", stats.total_customers],
    ["Active Customers", stats.active_customers],
    ["Replied Customers", stats.replied_customers],
    ["Total Follow-ups", stats.total_followups],
    ["Active Follow-ups", stats.active_followups],
    ["Completed Follow-ups", stats.completed_followups],
    ["Messages Sent", stats.messages_sent],
    ["Messages Received", stats.messages_received],
  ];

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar title="Dashboard" />

        {error && <div className="error">{error}</div>}

        <div className="stats-grid">
          {cards.map(([title, value]) => (
            <div className="stat-card" key={title}>
              <h3>{title}</h3>
              <strong>{value ?? 0}</strong>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;