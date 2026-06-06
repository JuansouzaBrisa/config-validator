interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", className = "" }: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <div className={`bg-slate-900 text-slate-50 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-400 uppercase">{language}</span>
        <span className="text-xs text-slate-500">{lines.length} linhas</span>
      </div>

      {/* Code */}
      <pre className="overflow-x-auto p-4">
        <code className="font-mono text-sm leading-relaxed">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              <span className="w-8 text-right pr-4 text-slate-500 select-none">
                {index + 1}
              </span>
              <span>{line || "\n"}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
