// Image optimization handler for Next.js on Amplify
const { ImageOptimizerCache } = require('next/dist/server/image-optimizer');

module.exports.handler = async (event) => {
  // Forward to Next.js image optimization
  const { default: imageOptimizer } = await import('next/dist/server/image-optimizer');

  return imageOptimizer({
    ...event,
    headers: event.headers || {},
  });
};
