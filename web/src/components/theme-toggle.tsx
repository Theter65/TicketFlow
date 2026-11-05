"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem("datelar-theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("datelar-theme", nextTheme);

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-lg border border-neutral-700 bg-neutral-900/50 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Cambiar tema claro / oscuro"
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg border transition shadow-sm ${
        theme === "dark"
          ? "border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-700"
          : "border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:border-slate-400"
      } ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition" />
      ) : (
        <Moon className="h-4 w-4 text-cyan-600 transition" />
      )}
    </button>
  );
}
