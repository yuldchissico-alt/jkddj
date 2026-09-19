import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiShieldStarLine, RiLockPasswordLine, RiUserLine } from "@remixicon/react";
import { toast } from "sonner";
import { loginUser, getStoredUser } from "@/services/auth";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin/owner
    const user = getStoredUser();
    if (user && (user.role === "owner" || user.role === "admin")) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      
      // Only allow owner and admin roles
      if (response.user.role !== "owner" && response.user.role !== "admin") {
        toast.error("Acesso negado. Apenas administradores podem acessar este painel.");
        setLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <Card className="w-full max-w-md relative z-10 border-slate-700 bg-slate-900/50 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 border-2 border-brand/20">
            <RiShieldStarLine className="h-8 w-8 text-brand" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Painel Administrativo</CardTitle>
            <CardDescription className="text-slate-400">
              Acesso restrito para administradores
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <div className="relative">
                <RiUserLine className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@nexuscale.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Senha
              </Label>
              <div className="relative">
                <RiLockPasswordLine className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Acessar Painel"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Voltar para login principal
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
