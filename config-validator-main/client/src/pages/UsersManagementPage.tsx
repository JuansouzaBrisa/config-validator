import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Shield, Users, ChevronLeft, UserCheck, UserX,
  Crown, User as UserIcon, Search, MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/25 text-xs font-semibold">
        <Crown className="w-3 h-3" /> Analista
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border text-xs font-semibold">
      <UserIcon className="w-3 h-3" /> Novato
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: number | boolean }) {
  const active = Boolean(isActive);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
      active
        ? "bg-green-500/10 text-green-500 border-green-500/25"
        : "bg-red-500/10 text-red-500 border-red-500/25"
    }`}>
      {active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-red-500", "bg-teal-500"];
  const color = colors[(name || "").charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Apenas administradores podem acessar esta página.</p>
          <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mt-4 border-border">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const usersQuery = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updateRole.useMutation();
  const deactivateMutation = trpc.users.deactivate.useMutation();
  const activateMutation = trpc.users.activate.useMutation();

  const handleRoleChange = async (userId: number, newRole: "user" | "admin") => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
      toast.success(`Role atualizado para ${newRole === "admin" ? "Analista" : "Novato"}`);
      usersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar role");
    }
  };

  const handleToggleActive = async (userId: number, isActive: number | boolean) => {
    const active = Boolean(isActive);
    if (active) {
      if (!confirm("Desativar este usuário?")) return;
      try {
        await deactivateMutation.mutateAsync({ userId });
        toast.success("Usuário desativado");
        usersQuery.refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro");
      }
    } else {
      try {
        await activateMutation.mutateAsync({ userId });
        toast.success("Usuário reativado");
        usersQuery.refetch();
      } catch (error: any) {
        toast.error(error.message || "Erro");
      }
    }
  };

  const filtered = (usersQuery.data || []).filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const totalUsers = usersQuery.data?.length || 0;
  const activeAdmins = (usersQuery.data || []).filter(u => u.role === "admin" && u.isActive).length;
  const activeUsers = (usersQuery.data || []).filter(u => u.role === "user" && u.isActive).length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Gerenciamento de Usuários</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">Gerencie roles e permissões dos usuários</p>
        </div>

        {/* Stats */}
        {!usersQuery.isLoading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total de usuários", count: totalUsers, color: "text-foreground", bg: "bg-card border-border" },
              { label: "Analistas ativos", count: activeAdmins, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
              { label: "Novatos ativos", count: activeUsers, color: "text-green-500", bg: "bg-green-500/5 border-green-500/20" },
            ].map(stat => (
              <div key={stat.label} className={`rounded-lg border p-4 ${stat.bg}`}>
                <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                <Users className="w-4 h-4" /> Usuários Cadastrados
              </CardTitle>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 h-8 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring w-52 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {usersQuery.isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2 pb-3">Usuário</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2 pb-3">Role</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2 pb-3">Status</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-2 pb-3">Cadastro</th>
                      <th className="px-2 py-2 pb-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <div>
                              <div className="font-medium text-foreground">
                                {u.name || "—"}
                                {u.id === user.id && (
                                  <span className="ml-1.5 text-xs text-primary font-normal">(você)</span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <RoleBadge role={u.role} />
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge isActive={u.isActive} />
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="px-2 py-3">
                          {u.id !== user.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(u.id, u.role === "admin" ? "user" : "admin")}
                                  className="text-sm cursor-pointer"
                                >
                                  {u.role === "admin" ? (
                                    <><UserIcon className="w-3.5 h-3.5 mr-2" /> Tornar Novato</>
                                  ) : (
                                    <><Crown className="w-3.5 h-3.5 mr-2" /> Tornar Analista</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleActive(u.id, u.isActive)}
                                  className={`text-sm cursor-pointer ${Boolean(u.isActive) ? "text-destructive focus:text-destructive" : "text-green-500 focus:text-green-500"}`}
                                >
                                  {Boolean(u.isActive) ? (
                                    <><UserX className="w-3.5 h-3.5 mr-2" /> Desativar</>
                                  ) : (
                                    <><UserCheck className="w-3.5 h-3.5 mr-2" /> Reativar</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
