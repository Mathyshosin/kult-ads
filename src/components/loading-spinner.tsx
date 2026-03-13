import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      {message && (
        <p className="text-sm text-muted animate-pulse">{message}</p>
      )}
    </div>
  );
}
