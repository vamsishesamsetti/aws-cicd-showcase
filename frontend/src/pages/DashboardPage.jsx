import { useState, useEffect, useCallback } from 'react'
import api from '../api/client'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
]

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  )
}

function EmptyState({ filter }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">
        {filter === 'all' ? '📋' : filter === 'todo' ? '🗒️' : filter === 'in-progress' ? '⚡' : '✅'}
      </div>
      <p className="font-semibold text-gray-700 mb-1">
        {filter === 'all' ? 'No tasks yet' : `No ${filter === 'in-progress' ? 'in-progress' : filter} tasks`}
      </p>
      <p className="text-sm text-gray-400">
        {filter === 'all' ? 'Click "+ New Task" to get started' : 'Switch to "All" to see everything'}
      </p>
    </div>
  )
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true)
    try {
      const res = await api.get('/tasks')
      setTasks(res.data.tasks)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const visible = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  function openCreate() { setEditingTask(null); setModalOpen(true) }
  function openEdit(task) { setEditingTask(task); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditingTask(null) }

  async function handleSave(form) {
    setSaving(true)
    try {
      if (editingTask) {
        const res = await api.put(`/tasks/${editingTask.taskId}`, form)
        setTasks(ts => ts.map(t => t.taskId === editingTask.taskId ? res.data.task : t))
      } else {
        const res = await api.post('/tasks', form)
        setTasks(ts => [res.data.task, ...ts])
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(task) {
    setDeleteTarget(task)
  }

  async function confirmDelete() {
    try {
      await api.delete(`/tasks/${deleteTarget.taskId}`)
      setTasks(ts => ts.filter(t => t.taskId !== deleteTarget.taskId))
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Tasks', value: counts.all, color: 'text-gray-900', bg: 'bg-white' },
            { label: 'To Do', value: counts.todo, color: 'text-slate-600', bg: 'bg-white' },
            { label: 'In Progress', value: counts['in-progress'], color: 'text-blue-600', bg: 'bg-white' },
            { label: 'Done', value: counts.done, color: 'text-emerald-600', bg: 'bg-white' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl shadow-sm border border-gray-100 p-5`}>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter bar + Add button */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {f.label}
                {f.key !== 'all' && (
                  <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-blue-200' : 'text-gray-400'}`}>
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <PlusIcon />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>

        {/* Task grid */}
        {loadingTasks ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.length === 0
              ? <EmptyState filter={filter} />
              : visible.map(task => (
                  <TaskCard key={task.taskId} task={task} onEdit={openEdit} onDelete={handleDelete} />
                ))
            }
          </div>
        )}
      </main>

      {/* Add / Edit modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onSave={handleSave}
          onClose={closeModal}
          loading={saving}
        />
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete task?</h3>
            <p className="text-sm text-gray-500 mb-6">
              "<span className="font-medium text-gray-700">{deleteTarget.title}</span>" will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
