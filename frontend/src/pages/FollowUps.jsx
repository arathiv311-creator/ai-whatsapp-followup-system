import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../api";
import "./FollowUps.css";

function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [customer, setCustomer] = useState("");
  const [firstMessageAt, setFirstMessageAt] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState(1440);
  const [maxFollowups, setMaxFollowups] = useState(3);

  async function loadFollowups() {
    try {
      const data = await apiRequest("/followups/");
      setFollowups(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadCustomers() {
    try {
      const data = await apiRequest("/customers/");
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadFollowups();
    loadCustomers();
  }, []);

  function resetForm() {
    setCustomer("");
    setFirstMessageAt("");
    setIntervalMinutes(1440);
    setMaxFollowups(3);
    setShowForm(false);
  }

  function closeForm() {
    resetForm();
    setError("");
  }

  async function createFollowup(e) {
    e.preventDefault();
    setError("");

    if (!customer || !firstMessageAt) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      await apiRequest("/followups/", {
        method: "POST",
        body: JSON.stringify({
          customer: Number(customer),
          first_message_at: new Date(firstMessageAt).toISOString(),
          interval_minutes: Number(intervalMinutes),
          max_followups: Number(maxFollowups),
        }),
      });

      resetForm();
      await loadFollowups();
    } catch (err) {
      setError(err.message);
    }
  }

  async function action(id, type) {
    setError("");

    try {
      await apiRequest(`/followups/${id}/${type}/`, {
        method: "POST",
      });

      await loadFollowups();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  }

  function getStatusClass(status) {
    switch (status) {
      case "active":
        return "fu-status fu-status-active";

      case "paused":
        return "fu-status fu-status-paused";

      case "stopped":
        return "fu-status fu-status-stopped";

      default:
        return "fu-status";
    }
  }

  return (
    <div className="fu-page">
      <main className="fu-main">

        {/* Navbar without title */}
        <Navbar />

        <div className="fu-content">

          {/* Back button */}
          <button
            type="button"
            className="fu-back-btn"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>

          {/* Error */}
          {error && (
            <div className="fu-error">
              <span>{error}</span>

              <button
                type="button"
                className="fu-error-close"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {/* Page heading */}
          <div className="fu-page-header">
            <div className="fu-title-area">
              <h1>Follow-ups</h1>

              <p className="fu-subtitle">
                Schedule and manage automated customer follow-ups.
              </p>
            </div>

            {!showForm && (
              <button
                type="button"
                className="fu-btn fu-btn-primary fu-add-btn"
                onClick={() => {
                  setError("");
                  setShowForm(true);
                }}
              >
                + Add Follow-up
              </button>
            )}
          </div>

          {/* Form */}
          {showForm && (
            <section className="fu-form-card">

              <div className="fu-form-header">
                <h2>Schedule Follow-up</h2>

                <p>
                  Configure when and how often the customer should receive
                  follow-up messages.
                </p>
              </div>

              <form onSubmit={createFollowup}>

                <div className="fu-form-grid">

                  <div className="fu-form-group">
                    <label htmlFor="customer">
                      Customer
                    </label>

                    <select
                      id="customer"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      required
                    >
                      <option value="">
                        Select Customer
                      </option>

                      {customers.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fu-form-group">
                    <label htmlFor="firstMessageAt">
                      First Message At
                    </label>

                    <input
                      id="firstMessageAt"
                      type="datetime-local"
                      value={firstMessageAt}
                      onChange={(e) =>
                        setFirstMessageAt(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="fu-form-group">
                    <label htmlFor="intervalMinutes">
                      Interval (Minutes)
                    </label>

                    <input
                      id="intervalMinutes"
                      type="number"
                      min="1"
                      value={intervalMinutes}
                      onChange={(e) =>
                        setIntervalMinutes(e.target.value)
                      }
                      required
                    />

                    <small>
                      Example: 60 = 1 hour, 1440 = 24 hours.
                    </small>
                  </div>

                  <div className="fu-form-group">
                    <label htmlFor="maxFollowups">
                      Maximum Follow-ups
                    </label>

                    <input
                      id="maxFollowups"
                      type="number"
                      min="1"
                      value={maxFollowups}
                      onChange={(e) =>
                        setMaxFollowups(e.target.value)
                      }
                      required
                    />
                  </div>

                </div>

                <div className="fu-form-actions">

                  <button
                    type="button"
                    className="fu-btn fu-btn-secondary"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="fu-btn fu-btn-primary fu-schedule-btn"
                  >
                    ✓ Schedule Follow-up
                  </button>

                </div>

              </form>
            </section>
          )}

          {/* Follow-ups table */}
          <section className="fu-table-card">

            <div className="fu-table-header">

              <div>
                <h2>Scheduled Follow-ups</h2>

                <p>
                  {followups.length} follow-up
                  {followups.length !== 1 ? "s" : ""} found
                </p>
              </div>

            </div>

            {followups.length === 0 ? (

              <div className="fu-empty">

                <div className="fu-empty-icon">
                  📅
                </div>

                <h3>
                  No Follow-ups Yet
                </h3>

                <p>
                  Create your first follow-up schedule to start
                  automating customer messages.
                </p>

                <button
                  type="button"
                  className="fu-btn fu-btn-primary"
                  onClick={() => {
                    setError("");
                    setShowForm(true);
                  }}
                >
                  + Add Follow-up
                </button>

              </div>

            ) : (

              <div className="fu-table-wrapper">

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

                        <td>
                          <span className="fu-id">
                            #{item.id}
                          </span>
                        </td>

                        <td>
                          <span className="fu-customer">
                            Customer {item.customer}
                          </span>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(item.status)}
                          >
                            <span className="fu-status-dot" />
                            {item.status}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {item.followups_sent}
                          </strong>

                          <span className="fu-total">
                            / {item.max_followups}
                          </span>
                        </td>

                        <td>
                          <span className="fu-next">
                            {formatDate(item.next_followup_at)}
                          </span>
                        </td>

                        <td>

                          <div className="fu-actions">

                            {item.status === "active" && (
                              <>
                                <button
                                  type="button"
                                  className="fu-btn fu-btn-warning fu-small-btn"
                                  onClick={() =>
                                    action(item.id, "pause")
                                  }
                                >
                                  ⏸ Pause
                                </button>

                                <button
                                  type="button"
                                  className="fu-btn fu-btn-danger fu-small-btn"
                                  onClick={() =>
                                    action(item.id, "stop")
                                  }
                                >
                                  ■ Stop
                                </button>
                              </>
                            )}

                            {item.status === "paused" && (
                              <button
                                type="button"
                                className="fu-btn fu-btn-success fu-small-btn"
                                onClick={() =>
                                  action(item.id, "resume")
                                }
                              >
                                ▶ Resume
                              </button>
                            )}

                            {item.status === "stopped" && (
                              <span className="fu-no-actions">
                                No actions
                              </span>
                            )}

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </div>

      </main>
    </div>
  );
}

export default FollowUps;