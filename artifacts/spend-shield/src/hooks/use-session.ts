import { useState, useEffect } from "react";

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("spendshield_session");
    if (stored) {
      setSessionId(stored);
    } else {
      const newSession = crypto.randomUUID();
      localStorage.setItem("spendshield_session", newSession);
      setSessionId(newSession);
    }
  }, []);

  return sessionId;
}
