/**
 * Register health check routes
 */
export function registerHealthRoutes(router) {
  // Import diagnostic routes
  const diagnosticRoutes = require('./health-diagnostic').default;
  router.use('/api', diagnosticRoutes);
}