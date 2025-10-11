import React, { useMemo, useState } from "react";
import { useUsers } from "../context/UsersContext";
import AddUser from "./AddUser";

const getId = (u) => u?._id || u?.id;
const emailRegex = /^\S+@\S+\.\S+$/;

export default function UserList() {
  const { users, loading, updateUser, deleteUser } = useUsers();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const onEdit = (u) => {
    setEditingId(getId(u));
    setForm({ name: u.name || "", email: u.email || "" });
    setErr("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", email: "" });
    setErr("");
  };

  const formError = useMemo(() => {
    if (!editingId) return "";
    if (!form.name.trim()) return "Name không được để trống";
    if (!emailRegex.test(form.email)) return "Email không hợp lệ";
    return "";
  }, [editingId, form]);

  const onSave = async (e) => {
    e.preventDefault();
    if (formError) { setErr(formError); return; }
    try {
      setSaving(true);
      await updateUser(editingId, { name: form.name.trim(), email: form.email.trim() });
      cancelEdit();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Sửa thất bại");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Xóa user này?")) return;
    try {
      await deleteUser(id);
    } catch {
      alert("Xóa thất bại");
    }
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h2>Quản lý Users</h2>

      {/* Form thêm có validation */}
      <AddUser />

      {/* Form sửa */}
      {editingId && (
        <form onSubmit={onSave} style={{ display: "grid", gap: 8, margin: "12px 0", padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <strong>Chỉnh sửa</strong>
          <input
            placeholder="Tên"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          {err && <span style={{ color: "crimson" }}>{err}</span>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={!!formError || saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
            <button type="button" onClick={cancelEdit}>Hủy</button>
          </div>
        </form>
      )}

      {/* Bảng */}
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th align="left">#</th>
            <th align="left">Tên</th>
            <th align="left">Email</th>
            <th align="left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => {
            const id = getId(u);
            return (
              <tr key={id} style={{ borderTop: "1px solid #eee" }}>
                <td>{i + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <button onClick={() => onEdit(u)} style={{ marginRight: 8 }}>Sửa</button>
                  <button onClick={() => onDelete(id)}>Xóa</button>
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr><td colSpan="4" align="center" style={{ color: "#666", padding: 24 }}>Chưa có user nào.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
