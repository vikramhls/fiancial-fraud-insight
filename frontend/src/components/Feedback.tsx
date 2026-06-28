import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={32} className="animate-spin text-blue-500" />
      <p className="text-sm text-[var(--color-text-muted)] font-medium">{message}</p>
    </div>
  );
}

export function ErrorMessage({ message = 'Something went wrong' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title = 'No data', description = '' }: { title?: string; description?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📭</span>
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        {description && <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>}
      </div>
    </div>
  );
}
