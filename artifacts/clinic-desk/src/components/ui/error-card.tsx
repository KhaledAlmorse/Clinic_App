import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { getErrorMessages } from "@/lib/error";

type ErrorCardProps = {
  error: unknown;
  title?: string;
  className?: string;
};

export function ErrorCard({
  error,
  title = "Please review the form",
  className,
}: ErrorCardProps) {
  const messages = getErrorMessages(error);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-2">
          <p className="font-semibold">{title}</p>
          {messages.length === 1 ? (
            <p className="text-destructive/90">{messages[0]}</p>
          ) : (
            <ul className="ml-4 list-disc space-y-1 text-destructive/90">
              {messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
