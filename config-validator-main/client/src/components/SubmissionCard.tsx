import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface SubmissionCardProps {
  title: string;
  ticketLink: string;
  status: "Pendente" | "Em revisão" | "Concluído";
  createdAt: Date;
  onClick: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pendente":
      return "⏳";
    case "Em revisão":
      return "👀";
    case "Concluído":
      return "✅";
    default:
      return "•";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pendente":
      return "bg-orange-100 text-orange-800";
    case "Em revisão":
      return "bg-blue-100 text-blue-800";
    case "Concluído":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
};

export function SubmissionCard({
  title,
  ticketLink,
  status,
  createdAt,
  onClick,
}: SubmissionCardProps) {
  return (
    <Card
      className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-xl">{getStatusIcon(status)}</span>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Link:{" "}
                  <a
                    href={ticketLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {ticketLink}
                  </a>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {createdAt.toLocaleDateString("pt-BR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                status
              )}`}
            >
              {status}
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
