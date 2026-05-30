const config = {
  'todo':        { label: 'To Do',       cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  'done':        { label: 'Done',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
}

export default function StatusBadge({ status }) {
  const { label, cls } = config[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 ring-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  )
}
