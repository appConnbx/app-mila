/** Spinner central para estados de carregamento (loading.tsx). */
export function Spinner() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-surface-border border-t-brand" />
    </div>
  );
}
