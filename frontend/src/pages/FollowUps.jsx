import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";

function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [error, setError] = useState("");

  async function loadFollowups() {
    try {
      const data = await apiRequest("/followups/");
      setFollowups(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadFollowups();
  }, []);

  async function action(id, type) {
    try {
      await apiRequest(`/followups/${id}/${type}/`, {
        method: "POST",
      });

      loadFollowups();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar title="Follow-ups" />

        {error && <div className="error">{error}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Sent</th>
                <th>Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {followups.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>

                  <td>{item.customer}</td>

                  <td>{item.status}</td>

                  <td>
                    {item.followups_sent} / {item.max_followups}
                  </td>

                  <td>{item.next_followup_at || "-"}</td>

                  <td>
                    {item.status === "active" && (
                      <>
                        <button
                          onClick={() =>
                            action(item.id, "pause")
                          }
                        >
                          Pause
                        </button>

                        <button
                          onClick={() =>
                            action(item.id, "stop")
                          }
                        >
                          Stop
                        </button>
                      </>
                    )}

                    {item.status === "paused" && (
                      <button
                        onClick={() =>
                          action(item.id, "resume")
                        }
                      >
                        Resume
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default FollowUps;