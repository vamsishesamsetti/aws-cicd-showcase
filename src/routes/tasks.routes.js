import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware.js'
import { listTasks, createTask, getTask, updateTask, deleteTask } from '../controllers/tasks.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', listTasks)
router.post('/', createTask)
router.get('/:id', getTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
