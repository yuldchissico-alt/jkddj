import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "@/services/auth";
import { LoginForm } from "./form";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setError("");
    setLoading(true);

    try {
      await loginUser(data);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo_lomustrack.png"
            alt="LomusTrack"
            className="h-14 w-auto object-contain drop-shadow-lg"
          />
          <p className="text-sm text-slate-400">
            Faça login para acessar o dashboard
          </p>
        </div>

        <LoginForm onSubmit={handleSubmit} error={error} loading={loading} />

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Não tem uma conta?{" "}
            <a
              href="/setup"
              className="text-white font-medium hover:underline"
            >
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
