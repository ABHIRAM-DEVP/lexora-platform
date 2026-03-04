"use client";

import { useState } from "react";
import { promoteUser } from "@/services/adminService";

export default function AdminPage() {
  const [email, setEmail] = useState("");

  const handlePromote = async () => {
    await promoteUser(email);
    alert("User promoted!");
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Admin Panel</h1>

      <input
        className="input mt-4"
        placeholder="User email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handlePromote} className="btn btn-primary mt-4">
        Promote to Admin
      </button>
    </div>
  );
}