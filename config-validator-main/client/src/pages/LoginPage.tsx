import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Terminal, Lock, Mail, User, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await loginMutation.mutateAsync({ email, password });
        if (result.success) {
          toast.success("Autenticado com sucesso");
          setLocation("/dashboard");
        }
      } else {
        const result = await registerMutation.mutateAsync({ email, password, name });
        if (result.success) {
          toast.success("Conta criada! Faça login para continuar.");
          setIsLogin(true);
          setPassword("");
          setName("");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(oklch(0.8 0.15 250) 1px, transparent 1px),
                             linear-gradient(90deg, oklch(0.8 0.15 250) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-sidebar-foreground font-bold text-xl tracking-tight" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
              Config Validator
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
              Validação de<br />
              <span className="text-primary">Configurações CLI</span>
            </h1>
            <p className="text-sidebar-foreground/60 text-base leading-relaxed">
              Submeta e revise configurações de equipamentos de rede como Huawei NE8000, Cisco ASR9K, e outros.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          {/* Fake terminal preview */}
          <div className="bg-black/40 rounded-lg border border-white/10 p-4 font-mono text-xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="text-white/30 ml-2">NE8000-M8 — config</span>
            </div>
            <div className="space-y-1">
              <div className="text-green-400/80">interface GigabitEthernet0/1/0</div>
              <div className="text-green-400/80 pl-2">description L2VPN_B2C_PE_30M</div>
              <div className="text-yellow-400/80 pl-2">qinq stacking vid 510</div>
              <div className="text-green-400/80 pl-2">qinq stacking vid 1510</div>
              <div className="text-red-400/80 pl-2">mpls l2vc 172.16.125.246 805</div>
              <div className="text-green-400/80 pl-2">statistic enable both</div>
              <div className="text-white/20">~</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sidebar-foreground/40 text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Revisão linha a linha com comentários dos analistas</span>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Config Validator</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
              {isLogin ? "Entrar na plataforma" : "Criar conta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Acesse com suas credenciais" : "Preencha os dados para criar sua conta"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                  <User className="w-3.5 h-3.5" /> Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  disabled={isLoading}
                  className="h-11 bg-card border-border focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-card border-border focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                <Lock className="w-3.5 h-3.5" /> Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-card border-border focus:border-primary pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Processando...
                </span>
              ) : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail(""); setPassword(""); setName("");
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Não tem conta? Registre-se" : "Já tem conta? Faça login"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-6 p-3 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/60">Admin padrão:</span>{" "}
              admin@configvalidator.local
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
