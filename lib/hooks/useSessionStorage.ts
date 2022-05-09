import { useState, useEffect } from "react";

function getStorageValue(key, defaultValue) {
  if (typeof window === "undefined") return defaultValue;

  const saved = sessionStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

export function useSessionStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    return getStorageValue(key, defaultValue);
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
