import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ChevronRight, Plus, Clock, Eye, CheckCircle, Terminal, Filter } from "lucide-react";

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    Pendente: {
      cls: "bg-amber-500/10 text-amber-500 border border-amber-500/25",
      icon: <Clock className="w-3 h-3" />,
    },
    "Em revisão": {
      cls: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
      icon: <Eye className="w-3 h-3" />,
    },
    Concluído: {
      cls: "bg-green-500/10 text-green-500 border border-green-500/25",
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };
  const s = map[status] || { cls: "bg-muted text-muted-foreground", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
      {s.icon} {status}
    </span>
  );
}

const FILTERS = [
  { label: "Todas", value: undefined },
  { label: "Pendente", value: "Pendente" },
  { label: "Em revisão", value: "Em revisão" },
  { label: "Concluído", value: "Concluído" },
] as const;

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<"Pendente" | "Em revisão" | "Concluído" | undefined>();

  const listSubmissions = trpc.submissions.list.useQuery({ status: statusFilter });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Faça login para acessar o dashboard.</p>
      </div>
    );
  }

  const submissions = listSubmissions.data || [];

  const counts = {
    Pendente: (listSubmissions.data || []).filter(s => s.status === "Pendente").length,
    "Em revisão": (listSubmissions.data || []).filter(s => s.status === "Em revisão").length,
    Concluído: (listSubmissions.data || []).filter(s => s.status === "Concluído").length,
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {user?.role === "admin" ? "Visão geral de todas as submissões" : "Suas submissões de configuração"}
            </p>
          </div>
          {user?.role === "user" && (
            <Button
              onClick={() => setLocation("/submit")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Plus className="w-4 h-4" /> Nova Submissão
            </Button>
          )}
        </div>

        {/* Stats row */}
        {!listSubmissions.isLoading && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pendente", count: counts.Pendente, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Em revisão", count: counts["Em revisão"], color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Concluído", count: counts.Concluído, color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" },
            ].map(stat => (
              <div key={stat.label} className={`rounded-lg border p-4 ${stat.bg}`}>
                <div className={`text-2xl font-bold tabular-nums ${stat.color}`}>{stat.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-1.5 mb-4">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {listSubmissions.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Terminal className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {statusFilter ? `Nenhuma submissão "${statusFilter}"` : "Nenhuma submissão encontrada"}
            </p>
            {user?.role === "user" && !statusFilter && (
              <Button
                variant="outline"
                className="mt-4 border-border text-sm"
                onClick={() => setLocation("/submit")}
              >
                <Plus className="w-4 h-4 mr-2" /> Criar primeira submissão
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map(sub => (
              <div
                key={sub.id}
                className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/30 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setLocation(`/submission/${sub.id}`)}
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Terminal className="w-4 h-4 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-semibold text-foreground truncate" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                      {sub.title}
                    </span>
                    <StatusChip status={sub.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <a
                      href={sub.ticketLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-primary hover:underline truncate max-w-xs"
                    >
                      {sub.ticketLink}
                    </a>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
