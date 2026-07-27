"use client";
import { useEffect, useState } from "react";

export function useSession() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = no session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);
  return user;
}
