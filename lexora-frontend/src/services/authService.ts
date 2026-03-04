// src/services/authService.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// Mock signup function (replace with real API call)
export async function signup(name: string, email: string, password: string): Promise<User> {
  // Normally you'd call your backend API here
  const newUser: User = { id: Date.now().toString(), name, email };
  localStorage.setItem("user", JSON.stringify(newUser));
  return newUser;
}

// Mock login function (replace with real API call)
export async function login(email: string, password: string): Promise<User> {
  const user: User = { id: "1", name: "John Doe", email };
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

// Logout user
export function logout() {
  localStorage.removeItem("user");
}

// Get current logged-in user from localStorage
export function getCurrentUser(): User | null {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}