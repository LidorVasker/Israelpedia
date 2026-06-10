// app/page.tsx
import AuthButtons from "@/components/auth-buttons";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>IsraelPedia</h1>
      <AuthButtons />
    </main>
  );
}