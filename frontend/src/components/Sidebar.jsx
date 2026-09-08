import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="logo">AI FollowUp</div>

      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <NavLink to="/followups">Follow-ups</NavLink>
        <NavLink to="/messages">Messages</NavLink>
      </nav>

      <button className="logout-btn" onClick={logout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;