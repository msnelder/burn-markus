import clsx from "clsx";
import { useState } from "react";
import { supabase } from "../utils/supabase-client";
import s from "./auth.module.css";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = async (email) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signIn({ email });
      if (error) throw error;
      alert("Check your email for the login link!");
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay">
      <div className={s["modal"]}>
        <div className={s["header"]}>
          <div className={s["auth-logo"]}>
            <img className={s["auth-mark"]} src="/images/logo.svg" alt="" />
            Burn
          </div>
          <p className={clsx(s["lead"], "text-gray-300")}>
            Burn connects to your bank account and tells you if and when you'll run out of money.
          </p>
        </div>
        <p className="text-xs text-gray-500">Add your email below to get started</p>
        <div className="input-group">
          <input
            className="input-block"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={(e) => {
              e.preventDefault();
              handleLogin(email);
            }}
            className="button button-primary button-block"
            disabled={loading}
          >
            <span>{loading ? "Loading" : "Send magic link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
