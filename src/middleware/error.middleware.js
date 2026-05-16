export function errorHandler(err, _req, res, _next) {
  console.error(err.stack)
  const status = err.statusCode || 500
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found' })
}
