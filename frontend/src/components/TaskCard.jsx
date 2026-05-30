import StatusBadge from './StatusBadge'

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
  )
}

export default function TaskCard({ task, onEdit, onDelete }) {
  const createdDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={task.status} />
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit task"
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete task"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 leading-snug mb-1.5">{task.title}</h3>

        {task.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{task.description}</p>
        )}
      </div>

      <div className="px-5 pb-4 pt-0">
        <p className="text-xs text-gray-400">{createdDate}</p>
      </div>
    </div>
  )
}
