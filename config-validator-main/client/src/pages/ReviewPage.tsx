import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ChevronRight, Clock, Terminal, ExternalLink } from "lucide-react";

export default function ReviewPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();

  const listSubmissions = trpc.submissions.list.useQuery({ limit: 50, offset: 0 });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Apenas analistas podem acessar esta página.</p>
      </div>
    );
  }

  if (listSubmissions.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const all = listSubmissions.data || [];
  const pending = all.filter(s => s.status === "Pendente");
  const inReview = all.filter(s => s.status === "Em revisão");

  const groups = [
    { label: "Em Revisão", items: inReview, color: "text-blue-400", dot: "bg-blue-500" },
    { label: "Pendentes", items: pending, color: "text-amber-500", dot: "bg-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Revisar Submissões</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pending.length + inReview.length} submissão(ões) aguardando revisão
          </p>
        </div>

        {pending.length === 0 && inReview.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Terminal className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhuma submissão pendente no momento</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.filter(g => g.items.length > 0).map(group => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${group.dot}`} />
                  <h2 className={`text-sm font-semibold ${group.color}`}>{group.label}</h2>
                  <span className="text-xs text-muted-foreground">({group.items.length})</span>
                </div>

                <div className="space-y-2">
                  {group.items.map(sub => (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-accent/20 transition-all cursor-pointer"
                      onClick={() => setLocation(`/submission/${sub.id}`)}
                    >
                      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Terminal className="w-4 h-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                          {sub.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(sub.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                          <a
                            href={sub.ticketLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" /> Chamado
                          </a>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
