export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-center">
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  )
}
