import { dashboardHandlers } from './dashboard.handlers.js'
import { userHandlers } from './user.handlers.js'

export const handlers = [...dashboardHandlers, ...userHandlers]
