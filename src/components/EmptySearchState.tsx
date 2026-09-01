interface EmptySearchStateProps {
  title: string;
  description: string;
}

export function EmptySearchState({
  title,
  description,
}: EmptySearchStateProps) {
  return (
    <div className="w-full max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}
