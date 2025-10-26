import React, { useState } from "react";
import { api } from "../api";

// Form thêm 1 user
export default function AddList({ onAdded }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/users", { name: name.trim(), email: email.trim() });
      onAdded?.(res.data); // báo cho cha cập nhật danh sách
      setName("");
      setEmail("");
    } catch (err) {
      alert(err?.response?.data?.message || "❌ Thêm thất bại");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      <strong>Thêm user</strong>
      <input
        placeholder="Tên"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Đang thêm..." : "Thêm"}
      </button>
    </form>
  );
}
