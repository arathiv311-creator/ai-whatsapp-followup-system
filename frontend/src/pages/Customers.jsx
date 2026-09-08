import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Customers() {
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    notes: "",
    status: "active",
  });

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

    // Remove field error while typing
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
      newErrors.phone = "Phone number must be between 10 and 15 digits.";
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
      await apiRequest("/customers/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          notes: form.notes.trim(),
        }),
      });

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
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Navbar title="Customers" />

        <section className="content">

          {/* Add Customer */}
          <div className="form-card">
            <h2>Add Customer</h2>

            {apiError && (
              <div className="error">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Name *</label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                />

                {errors.name && (
                  <small className="field-error">
                    {errors.name}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Phone *</label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />

                {errors.phone && (
                  <small className="field-error">
                    {errors.phone}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />

                {errors.email && (
                  <small className="field-error">
                    {errors.email}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Company</label>

                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Enter notes"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Status</label>

                <select
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

              <button
                type="submit"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Customer"}
              </button>

            </form>
          </div>

          {/* Customer List */}
          <div className="table-card">
            <h2>Customer List</h2>

            {customers.length === 0 ? (
              <p>No customers found.</p>
            ) : (
              <div className="table-wrapper">
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
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email || "-"}</td>
                        <td>{customer.company || "-"}</td>
                        <td>{customer.status}</td>

                        <td>
                          <button
                            className="delete-btn"
                            onClick={() =>
                              handleDelete(customer.id)
                            }
                          >
                            Delete
                          </button>
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