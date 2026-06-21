"use client";
import { useActionState } from "react";
import { registerUser } from "./actions";

const inputStyle = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: "1rem",
  width: "100%",
};

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerUser, null);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {state?.error && <p style={{ color: "red", margin: 0 }}>{state.error}</p>}

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Name
        <input name="name" type="text" required autoComplete="name" style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Email
        <input name="email" type="email" required autoComplete="email" style={inputStyle} />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <span>
          Password{" "}
          <span style={{ color: "#888", fontSize: "0.85rem", fontWeight: "normal" }}>
            (min 8 characters)
          </span>
        </span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          style={inputStyle}
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        Confirm password
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          style={inputStyle}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: "0.6rem 1rem",
          background: "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: "1rem",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
