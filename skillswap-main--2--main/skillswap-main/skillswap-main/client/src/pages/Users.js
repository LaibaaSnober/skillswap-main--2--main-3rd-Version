import React, { useEffect, useState } from "react";
import API from "../config/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users/all");
        setUsers(res.data);
      } catch (error) {
        console.log("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <h3 style={{ padding: "20px" }}>Loading users...</h3>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>All Users</h2>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "15px",
          }}
        >
          {users.map((user) => (
            <div
              key={user._id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "10px",
              }}
            >
              <h3>{user.name}</h3>

              <p>⭐ Reputation: {user.reputation || 0}</p>

              <p>
                🔥 Skills:
                {user.verifiedSkills?.length > 0 ? (
                  user.verifiedSkills.map((s, i) => (
                    <span
                      key={i}
                      style={{ marginLeft: "5px", color: "green" }}
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span style={{ marginLeft: "5px", color: "gray" }}>
                    No skills
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;