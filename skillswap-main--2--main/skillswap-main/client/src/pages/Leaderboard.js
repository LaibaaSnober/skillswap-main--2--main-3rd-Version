import React, { useEffect, useState } from "react";
import API from "../config/api";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await API.get("/users/all");

      const sorted = res.data.sort(
  (a, b) =>
    (b.reputation || 0) +
    (b.completedSwaps || 0) +
    (b.verifiedSkills?.length || 0) -
    ((a.reputation || 0) +
      (a.completedSwaps || 0) +
      (a.verifiedSkills?.length || 0))
);
      setUsers(sorted);
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>🏆 Leaderboard</h2>

      {users.map((u, index) => (
        <div
          key={u._id}
          style={{
            padding: "10px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <h3>
            #{index + 1} {u.name}
          </h3>
          <p>⭐ {u.reputation || 0}</p>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;