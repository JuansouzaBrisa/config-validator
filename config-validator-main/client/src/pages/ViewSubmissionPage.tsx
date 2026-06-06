import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Loader2, ChevronLeft, Check, X, AlertCircle, ExternalLink, Terminal } from "lucide-react";
import { toast } from "sonner";

type ReviewStatus = "Correto" | "Erro" | "Desnecessário";

interface ReviewState {
  itemId: number;
  status: ReviewStatus | null;
  comment: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pendente: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
    "Em revisão": "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Concluído: "bg-green-500/15 text-green-500 border border-green-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${map[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

export default function ViewSubmissionPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const submissionId = parseInt(params.id || "0");

  const [reviewStates, setReviewStates] = useState<Record<number, ReviewState>>({});
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedLine, setSelectedLine] = useState<string>("");

  const getSubmission = trpc.submissions.getById.useQuery(submissionId, {
    enabled: submissionId > 0,
  });
  const submitReview = trpc.reviews.submitReview.useMutation();
  const updateStatus = trpc.submissions.updateStatus.useMutation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Acesso negado. Faça login.</p>
      </div>
    );
  }

  if (getSubmission.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!getSubmission.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Submissão não encontrada.</p>
          <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mt-4">Voltar</Button>
        </div>
      </div>
    );
  }

  const submission = getSubmission.data;
  const isAnalyst = user?.role === "admin";

  const getLineClass = (status: ReviewStatus | null | undefined) => {
    switch (status) {
      case "Correto": return "status-correct";
      case "Erro": return "status-error";
      case "Desnecessário": return "status-unnecessary";
      default: return "";
    }
  };

  const getStatusIcon = (status: ReviewStatus | null | undefined) => {
    switch (status) {
      case "Correto": return <Check className="w-3.5 h-3.5 text-green-500" />;
      case "Erro": return <X className="w-3.5 h-3.5 text-red-500" />;
      case "Desnecessário": return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
      default: return null;
    }
  };

  const handleLineClick = (itemId: number, lineContent: string) => {
    if (!isAnalyst) return;
    setSelectedReviewId(itemId);
    setSelectedLine(lineContent);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedReviewId) return;
    const state = reviewStates[selectedReviewId];
    if (!state?.status) { toast.error("Selecione um status"); return; }

    try {
      await submitReview.mutateAsync({
        reviewItemId: selectedReviewId,
        reviewStatus: state.status,
        comment: state.comment || undefined,
      });
      toast.success("Revisão enviada");
      setShowReviewDialog(false);
      getSubmission.refetch();
    } catch {
      toast.error("Erro ao enviar revisão");
    }
  };

  const handleStatusUpdate = async (status: "Pendente" | "Em revisão" | "Concluído") => {
    try {
      await updateStatus.mutateAsync({ submissionId, status });
      toast.success(`Status atualizado para "${status}"`);
      getSubmission.refetch();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const totalLines = submission.devices.reduce((acc, d) => acc + (d.reviews?.length || 0), 0);
  const reviewedLines = submission.devices.reduce(
    (acc, d) => acc + (d.reviews?.filter(r => r.reviewStatus !== null).length || 0), 0
  );
  const progress = totalLines > 0 ? Math.round((reviewedLines / totalLines) * 100) : 0;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>{submission.title}</h1>
              <a
                href={submission.ticketLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" /> {submission.ticketLink}
              </a>
            </div>

            <div className="flex flex-col items-end gap-3">
              <StatusBadge status={submission.status} />

              {isAnalyst && (
                <div className="flex gap-2">
                  {submission.status !== "Em revisão" && (
                    <Button size="sm" variant="outline" className="border-border text-xs h-8"
                      onClick={() => handleStatusUpdate("Em revisão")}>
                      Iniciar revisão
                    </Button>
                  )}
                  {submission.status !== "Concluído" && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                      onClick={() => handleStatusUpdate("Concluído")}>
                      <Check className="w-3 h-3 mr-1" /> Concluir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        {totalLines > 0 && (
          <Card className="border-border bg-card mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">Progresso da revisão</span>
                <span className="text-xs font-semibold text-foreground">{reviewedLines}/{totalLines} linhas</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {submission.description && (
          <Card className="border-border bg-card mb-6">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{submission.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Devices */}
        <div className="space-y-6">
          {submission.devices.map((device) => (
            <Card key={device.id} className="border-border bg-card overflow-hidden">
              <CardHeader className="pb-0 bg-muted/30 border-b border-border">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                      {device.name}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {device.reviews?.filter(r => r.reviewStatus).length || 0}/{device.reviews?.length || 0} revisadas
                  </span>
                </div>
              </CardHeader>

              {/* Code block */}
              <div className="bg-[oklch(0.1_0.015_250)] dark:bg-[oklch(0.08_0.015_250)]">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="select-none py-3 px-3 text-right text-xs font-mono leading-6 text-white/20 min-w-[3rem] border-r border-white/5 flex-shrink-0">
                    {device.reviews?.map((r) => (
                      <div key={r.id}>{r.lineNumber}</div>
                    ))}
                  </div>

                  {/* Lines */}
                  <div className="flex-1 py-3">
                    {device.reviews?.map((review) => {
                      const localStatus = reviewStates[review.id]?.status;
                      const effectiveStatus = localStatus || review.reviewStatus as ReviewStatus | null;

                      return (
                        <div
                          key={review.id}
                          className={`code-line px-3 flex items-center gap-3 leading-6 ${getLineClass(effectiveStatus)} ${isAnalyst ? "cursor-pointer" : ""}`}
                          onClick={() => handleLineClick(review.id, review.lineContent)}
                          title={isAnalyst ? "Clique para revisar esta linha" : undefined}
                        >
                          <code className="flex-1 text-xs font-mono text-green-300/85 break-all">
                            {review.lineContent}
                          </code>
                          {effectiveStatus && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {getStatusIcon(effectiveStatus)}
                              {review.comment && (
                                <span className="text-xs text-white/40 max-w-[200px] truncate" title={review.comment}>
                                  {review.comment}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Revisar Linha</DialogTitle>
          </DialogHeader>

          {selectedLine && (
            <div className="rounded-md bg-[oklch(0.1_0.015_250)] border border-white/10 px-3 py-2">
              <code className="text-xs font-mono text-green-300/85">{selectedLine}</code>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["Correto", "Erro", "Desnecessário"] as const).map(status => {
                  const isSelected = reviewStates[selectedReviewId!]?.status === status;
                  const colors: Record<string, string> = {
                    Correto: isSelected ? "bg-green-600 text-white border-green-600" : "border-border hover:border-green-500 text-muted-foreground hover:text-green-500",
                    Erro: isSelected ? "bg-red-600 text-white border-red-600" : "border-border hover:border-red-500 text-muted-foreground hover:text-red-500",
                    Desnecessário: isSelected ? "bg-yellow-600 text-white border-yellow-600" : "border-border hover:border-yellow-500 text-muted-foreground hover:text-yellow-500",
                  };
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        if (!selectedReviewId) return;
                        setReviewStates(prev => ({
                          ...prev,
                          [selectedReviewId]: {
                            ...prev[selectedReviewId],
                            itemId: selectedReviewId,
                            status,
                            comment: prev[selectedReviewId]?.comment || "",
                          },
                        }));
                      }}
                      className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md border text-xs font-semibold transition-all ${colors[status]}`}
                    >
                      {status === "Correto" && <Check className="w-3 h-3" />}
                      {status === "Erro" && <X className="w-3 h-3" />}
                      {status === "Desnecessário" && <AlertCircle className="w-3 h-3" />}
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                Comentário <span className="normal-case font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Textarea
                placeholder="Explique o motivo ou adicione uma nota..."
                value={reviewStates[selectedReviewId!]?.comment || ""}
                onChange={e => {
                  if (!selectedReviewId) return;
                  setReviewStates(prev => ({
                    ...prev,
                    [selectedReviewId]: {
                      ...prev[selectedReviewId],
                      itemId: selectedReviewId,
                      status: prev[selectedReviewId]?.status || null,
                      comment: e.target.value,
                    },
                  }));
                }}
                rows={3}
                className="bg-background border-border text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)} className="border-border h-9 text-sm">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={submitReview.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-sm gap-2"
              >
                {submitReview.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar revisão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
