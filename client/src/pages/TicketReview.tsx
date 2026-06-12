import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, ExternalLink, MessageCircle, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TicketReview() {
  const { id } = useParams<{ id: string }>();
  const submissionId = parseInt(id || "0");
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.submissions.getDetails.useQuery({ id: submissionId });
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [comment, setComment] = useState("");

  const updateStatus = trpc.submissions.updateLineStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      setSelectedItem(null);
      setComment("");
      utils.submissions.getDetails.invalidate({ id: submissionId });
    },
    onError: (err) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10" /></div>;
  if (error || !data) return <div className="p-20 text-center text-red-500">Erro ao carregar ticket: {error?.message || "Não encontrado"}</div>;

  const { submission, device, items } = data;

  const handleReview = (status: "Correto" | "Erro" | "Desnecessário") => {
    if (!selectedItem) return;
    updateStatus.mutate({
      itemId: selectedItem.id,
      status,
      comment: comment || undefined,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            {submission.title}
            <span className={cn(
              "text-xs px-2 py-1 rounded-full border",
              submission.status === "Concluído" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
              submission.status === "Em revisão" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
              "bg-slate-500/10 text-slate-500 border-slate-500/20"
            )}>
              {submission.status}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">Equipamento: <span className="font-semibold text-foreground">{device?.name}</span></p>
        </div>
        <Button variant="outline" asChild>
          <a href={submission.ticketLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" /> Ver Chamado Original
          </a>
        </Button>
      </div>

      <Card className="border-2 overflow-hidden bg-slate-950 text-slate-300">
        <CardHeader className="border-b border-slate-800 bg-slate-900/50 py-3">
          <CardTitle className="text-sm font-mono text-slate-400 uppercase tracking-wider">Script de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="p-0 font-mono text-sm leading-relaxed">
          <div className="divide-y divide-slate-900">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => user?.role !== "user" && setSelectedItem(item)}
                className={cn(
                  "group flex items-start transition-colors cursor-pointer",
                  item.reviewStatus === "Pendente" && "hover:bg-slate-900",
                  item.reviewStatus === "Correto" && "bg-emerald-950/40 border-l-4 border-l-emerald-500",
                  item.reviewStatus === "Erro" && "bg-rose-950/40 border-l-4 border-l-rose-500",
                  item.reviewStatus === "Desnecessário" && "bg-amber-950/40 border-l-4 border-l-amber-500"
                )}
              >
                <div className="w-12 py-1 text-right pr-4 text-slate-600 select-none bg-slate-900/30">
                  {item.lineNumber}
                </div>
                <div className="flex-1 py-1 px-4 flex justify-between items-center min-h-[2rem]">
                  <span>{item.lineContent || " "}</span>
                  <div className="flex items-center gap-2">
                    {item.comment && (
                      <div className="group/note relative">
                        <MessageCircle className="h-4 w-4 text-slate-500 hover:text-primary transition-colors" />
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-slate-100 rounded-lg shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity z-10 text-xs pointer-events-none border border-slate-700">
                          <p className="font-bold mb-1 text-primary">Nota do Analista:</p>
                          {item.comment}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revisar Linha {selectedItem?.lineNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-3 bg-slate-950 rounded font-mono text-sm text-slate-300 break-all">
              {selectedItem?.lineContent}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentário / Observação</label>
              <Textarea
                placeholder="Explique o erro de sintaxe ou nomenclatura..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
              onClick={() => handleReview("Correto")}
              disabled={updateStatus.isPending}
            >
              <Check className="mr-2 h-4 w-4" /> Correto
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
              onClick={() => handleReview("Erro")}
              disabled={updateStatus.isPending}
            >
              <X className="mr-2 h-4 w-4" /> Erro
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
              onClick={() => handleReview("Desnecessário")}
              disabled={updateStatus.isPending}
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Desnecessário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
