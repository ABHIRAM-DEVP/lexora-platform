"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  // redirect if not logged in
  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
      <button
        onClick={() => {
          logout();
          router.push("/login");
        }}
        className="btn btn-secondary mt-4"
      >
        Logout
      </button>
    </div>
  );
}