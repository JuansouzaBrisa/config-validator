import { Check, X, AlertCircle } from "lucide-react";

interface ReviewStatusBadgeProps {
  status: "Correto" | "Erro" | "Desnecessário" | null;
  comment?: string;
  showIcon?: boolean;
}

export function ReviewStatusBadge({
  status,
  comment,
  showIcon = true,
}: ReviewStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const getStyles = () => {
    switch (status) {
      case "Correto":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          border: "border-green-300",
          icon: <Check className="w-4 h-4 text-green-600" />,
        };
      case "Erro":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          border: "border-red-300",
          icon: <X className="w-4 h-4 text-red-600" />,
        };
      case "Desnecessário":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          border: "border-yellow-300",
          icon: <AlertCircle className="w-4 h-4 text-yellow-600" />,
        };
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-800",
          border: "border-slate-300",
          icon: null,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} ${styles.text} border-2 ${styles.border} rounded p-2`}>
      <div className="flex items-center gap-2">
        {showIcon && styles.icon}
        <span className="text-xs font-semibold">{status}</span>
      </div>
      {comment && (
        <p className="text-xs mt-1 opacity-90">
          <strong>Nota:</strong> {comment}
        </p>
      )}
    </div>
  );
}
