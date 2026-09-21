import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "./Customers.css";

function Customers() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    notes: "",
    status: "active",
  });

  const [editingId, setEditingId] = useState(null);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    try {
      const data = await apiRequest("/customers/");
      setCustomers(data);
    } catch (err) {
      setApiError(err.message);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });

    setApiError("");
  }

  function validateForm() {
    const newErrors = {};

    // Name
    if (!form.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must contain at least 2 characters.";
    }

    // Phone
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d+$/.test(form.phone.trim())) {
      newErrors.phone = "Phone number must contain only digits.";
    } else if (
      form.phone.trim().length < 10 ||
      form.phone.trim().length > 15
    ) {
      newErrors.phone =
        "Phone number must be between 10 and 15 digits.";
    }

    // Email
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = "Enter a valid email address.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = JSON.stringify({
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
      });

      if (editingId) {
        await apiRequest(`/customers/${editingId}/`, {
          method: "PUT",
          body: payload,
        });

        setEditingId(null);
      } else {
        await apiRequest("/customers/", {
          method: "POST",
          body: payload,
        });
      }

      setForm({
        name: "",
        phone: "",
        email: "",
        company: "",
        notes: "",
        status: "active",
      });

      setErrors({});

      await loadCustomers();
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(customer) {
    setEditingId(customer.id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      company: customer.company || "",
      notes: customer.notes || "",
      status: customer.status,
    });
    setErrors({});
    setApiError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      company: "",
      notes: "",
      status: "active",
    });
    setErrors({});
    setApiError("");
  }

  function sendAiMessage(customer) {
    navigate(`/messages?customer=${customer.id}`);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/customers/${id}/`, {
        method: "DELETE",
      });

      await loadCustomers();
    } catch (err) {
      setApiError(err.message);
    }
  }

  return (
    <div className="customers-page">
      <Sidebar />

      <main className="customers-main">
        <Navbar />

        <section className="customers-content">

          {/* PAGE TITLE */}
          <div className="customers-title">
            <h1>Customers</h1>
            <p>Manage your customers and their information.</p>
          </div>

          {/* ADD CUSTOMER FORM */}
          <div className="customer-form-card">

            <div className="customer-form-header">
              <h2>
                {editingId ? "Edit Customer" : "Add Customer"}
              </h2>
              <p>
                {editingId
                  ? "Update the customer details below."
                  : "Enter customer details to add a new customer."}
              </p>
            </div>

            {apiError && (
              <div className="customer-error">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* NAME */}
              <div className="customer-form-group">
                <label htmlFor="name">
                  Name <span>*</span>
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                />

                {errors.name && (
                  <small className="customer-field-error">
                    {errors.name}
                  </small>
                )}
              </div>

              {/* PHONE */}
              <div className="customer-form-group">
                <label htmlFor="phone">
                  Phone <span>*</span>
                </label>

                <input
                  id="phone"
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

                {errors.phone && (
                  <small className="customer-field-error">
                    {errors.phone}
                  </small>
                )}
              </div>

              {/* EMAIL */}
              <div className="customer-form-group">
                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />

                {errors.email && (
                  <small className="customer-field-error">
                    {errors.email}
                  </small>
                )}
              </div>

              {/* COMPANY */}
              <div className="customer-form-group">
                <label htmlFor="company">
                  Company
                </label>

                <input
                  id="company"
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>

              {/* NOTES */}
              <div className="customer-form-group">
                <label htmlFor="notes">
                  Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Enter notes"
                  rows="4"
                />
              </div>

              {/* STATUS */}
              <div className="customer-form-group">
                <label htmlFor="status">
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="replied">Replied</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* SUBMIT */}
              <div className="customer-submit-area">
                {editingId && (
                  <button
                    type="button"
                    className="customer-cancel-btn"
                    onClick={cancelEdit}
                  >
                    Cancel Edit
                  </button>
                )}

                <button
                  type="submit"
                  className="customer-add-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Customer"}
                </button>
              </div>

            </form>
          </div>

          {/* CUSTOMER LIST */}
          <div className="customer-list-card">

            <div className="customer-list-header">
              <div>
                <h2>Customer List</h2>

                <p>
                  {customers.length} customer
                  {customers.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>

            {customers.length === 0 ? (
              <div className="customer-empty">
                <p>No customers found.</p>
              </div>
            ) : (
              <div className="customer-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>

                        <td>
                          <span className="customer-id">
                            #{customer.id}
                          </span>
                        </td>

                        <td>
                          <strong>{customer.name}</strong>
                        </td>

                        <td>
                          {customer.phone}
                        </td>

                        <td>
                          {customer.email || "-"}
                        </td>

                        <td>
                          {customer.company || "-"}
                        </td>

                        <td>
                          <span
                            className={`customer-status customer-status-${customer.status}`}
                          >
                            {customer.status}
                          </span>
                        </td>

                        <td>
                          <div className="customer-actions">
                            <button
                              type="button"
                              className="customer-edit-btn"
                              onClick={() => startEdit(customer)}
                            >
                              ✏ Edit
                            </button>

                            <button
                              type="button"
                              className="customer-ai-btn"
                              onClick={() => sendAiMessage(customer)}
                            >
                              ✉ AI Message
                            </button>

                            <button
                              type="button"
                              className="customer-delete-btn"
                              onClick={() =>
                                handleDelete(customer.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </section>
      </main>
    </div>
  );
}

export default Customers;