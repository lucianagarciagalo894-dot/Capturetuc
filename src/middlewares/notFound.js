function notFound(req, res) {
  res.status(404).json({ status: 'error', message: `Ruta no encontrada: ${req.originalUrl}` });
}

module.exports = notFound;
