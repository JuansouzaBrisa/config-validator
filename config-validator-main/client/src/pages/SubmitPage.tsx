import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Plus, Trash2, Loader2, Terminal, ChevronLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Device {
  id: string;
  name: string;
  configCode: string;
  deviceType: string;
}

const DEVICE_TYPES = [
  { value: "huawei-ne8000", label: "Huawei NE8000", color: "text-red-500" },
  { value: "huawei-vrp", label: "Huawei VRP (genérico)", color: "text-red-400" },
  { value: "cisco-asr9k", label: "Cisco ASR9K", color: "text-blue-500" },
  { value: "cisco-ncs", label: "Cisco NCS", color: "text-blue-400" },
  { value: "cisco-ios-xe", label: "Cisco IOS-XE", color: "text-blue-300" },
  { value: "juniper-junos", label: "Juniper JunOS", color: "text-green-500" },
  { value: "nokia-sros", label: "Nokia SR-OS", color: "text-purple-500" },
  { value: "other", label: "Outro", color: "text-muted-foreground" },
];

function CliEditor({
  value,
  onChange,
  deviceType,
}: {
  value: string;
  onChange: (v: string) => void;
  deviceType: string;
}) {
  const lines = value.split("\n");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      }, 0);
    }
  };

  const typeLabel = DEVICE_TYPES.find(d => d.value === deviceType)?.label || "CLI";

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[oklch(0.1_0.015_250)] dark:bg-[oklch(0.08_0.015_250)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[oklch(0.15_0.02_250)] border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-white/40 text-xs font-mono">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/25 text-xs font-mono">{lines.length} linhas</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/10 transition-colors text-white/40 hover:text-white/70"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex">
        {/* Line numbers */}
        <div
          className="select-none py-3 px-3 text-right text-xs font-mono leading-6 text-white/20 bg-transparent min-w-[3rem] border-r border-white/5"
          aria-hidden
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
          {lines.length === 0 && <div>1</div>}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleTab}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={`# Cole os comandos CLI aqui...\ninterface GigabitEthernet0/0/1\n  description LINK_PE_CE\n  ip address 10.0.0.1 255.255.255.252`}
          className="flex-1 bg-transparent text-green-300/90 text-xs font-mono leading-6 py-3 px-3 resize-none focus:outline-none placeholder:text-white/15 min-h-[280px]"
          style={{ caretColor: "oklch(0.7 0.2 145)" }}
        />
      </div>
    </div>
  );
}

export default function SubmitPage() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [ticketLink, setTicketLink] = useState("");
  const [description, setDescription] = useState("");
  const [devices, setDevices] = useState<Device[]>([
    { id: "1", name: "", configCode: "", deviceType: "huawei-ne8000" },
  ]);

  const createSubmission = trpc.submissions.create.useMutation();

  if (!isAuthenticated || user?.role !== "user") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Apenas usuários podem criar submissões.</p>
          <Button variant="outline" onClick={() => setLocation("/")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleAddDevice = () => {
    const newId = Math.max(...devices.map(d => parseInt(d.id)), 0) + 1;
    setDevices([...devices, { id: newId.toString(), name: "", configCode: "", deviceType: "huawei-ne8000" }]);
  };

  const handleRemoveDevice = (id: string) => {
    if (devices.length > 1) setDevices(devices.filter(d => d.id !== id));
  };

  const handleDeviceChange = (id: string, field: keyof Device, value: string) => {
    setDevices(devices.map(d => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    if (!ticketLink.trim()) { toast.error("Link do chamado é obrigatório"); return; }
    if (devices.some(d => !d.name.trim() || !d.configCode.trim())) {
      toast.error("Todos os devices devem ter nome e configuração");
      return;
    }

    try {
      await createSubmission.mutateAsync({
        title,
        ticketLink,
        description,
        devices: devices.map(d => ({ name: d.name, configCode: d.configCode, deviceType: d.deviceType })),
      });
      toast.success("Submissão criada com sucesso!");
      setLocation("/dashboard");
    } catch (error) {
      toast.error("Erro ao criar submissão");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </button>
          <h1 className="text-2xl font-bold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Nova Submissão</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Envie configurações CLI para revisão pelos analistas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Informações da Submissão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-sm text-foreground/80">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Configuração L2VPN PE Recife"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="bg-background border-border h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ticketLink" className="text-sm text-foreground/80">Link do Chamado *</Label>
                  <Input
                    id="ticketLink"
                    type="url"
                    placeholder="https://saski.brisanet.com.br/chamado/..."
                    value={ticketLink}
                    onChange={e => setTicketLink(e.target.value)}
                    className="bg-background border-border h-10"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm text-foreground/80">Observações</Label>
                <Textarea
                  id="description"
                  placeholder="Contexto adicional sobre a submissão..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="bg-background border-border resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Devices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>Dispositivos</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cada device terá suas linhas revisadas individualmente</p>
              </div>
              <Button
                type="button"
                onClick={handleAddDevice}
                variant="outline"
                size="sm"
                className="border-border gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Device
              </Button>
            </div>

            {devices.map((device, index) => (
              <Card key={device.id} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                        <Terminal className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-semibold" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
                        Device {index + 1}
                      </span>
                    </div>
                    {devices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-foreground/80">Nome do Device *</Label>
                      <Input
                        placeholder="Ex: mpls-recife-101"
                        value={device.name}
                        onChange={e => handleDeviceChange(device.id, "name", e.target.value)}
                        className="bg-background border-border h-10 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm text-foreground/80">Tipo de Equipamento</Label>
                      <select
                        value={device.deviceType}
                        onChange={e => handleDeviceChange(device.id, "deviceType", e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {DEVICE_TYPES.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-foreground/80">Configuração CLI *</Label>
                      <span className="text-xs text-muted-foreground">Tab = 2 espaços</span>
                    </div>
                    <CliEditor
                      value={device.configCode}
                      onChange={v => handleDeviceChange(device.id, "configCode", v)}
                      deviceType={device.deviceType}
                    />
                    <p className="text-xs text-muted-foreground">
                      {device.configCode.split("\n").filter(l => l.trim()).length} linhas não-vazias serão revisadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createSubmission.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {createSubmission.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : "Enviar Submissão"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
