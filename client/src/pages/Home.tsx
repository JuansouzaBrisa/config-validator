import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [ticketLink, setTicketLink] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [configCode, setConfigCode] = useState("");

  const createSubmission = trpc.submissions.create.useMutation({
    onSuccess: (data) => {
      toast.success("Submissão criada com sucesso!");
      setLocation(`/ticket/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar submissão: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para enviar.");
      return;
    }
    createSubmission.mutate({
      title,
      ticketLink,
      deviceName,
      configCode,
    });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card className="border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Config Validator</CardTitle>
          <CardDescription>
            Envie scripts de rede para validação dos analistas seniores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Número do Chamado (ex: INC123456)</Label>
                <Input
                  id="title"
                  placeholder="INC..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticketLink">Link do Chamado Interno</Label>
                <Input
                  id="ticketLink"
                  type="url"
                  placeholder="https://sistema.empresa.com/..."
                  value={ticketLink}
                  onChange={(e) => setTicketLink(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deviceName">Nome do Equipamento</Label>
              <Input
                id="deviceName"
                placeholder="Switch-Core-01"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="configCode">Configurações (Cole o script abaixo)</Label>
              <Textarea
                id="configCode"
                placeholder="no shutdown..."
                className="min-h-[300px] font-mono bg-slate-950 text-slate-50 border-slate-800 focus-visible:ring-slate-700"
                value={configCode}
                onChange={(e) => setConfigCode(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-lg h-12" 
              disabled={createSubmission.isPending}
            >
              {createSubmission.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Gerar Link de Validação
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
