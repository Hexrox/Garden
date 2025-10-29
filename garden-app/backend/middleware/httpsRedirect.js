/**
 * Middleware to enforce HTTPS in production
 * Redirects HTTP requests to HTTPS
 */
function httpsRedirect(req, res, next) {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    // Check if request is already HTTPS
    const isHttps = req.secure ||
                    req.headers['x-forwarded-proto'] === 'https' ||
                    req.headers['x-forwarded-ssl'] === 'on';

    if (!isHttps) {
      // Construct HTTPS URL
      const httpsUrl = `https://${req.hostname}${req.url}`;

      // Redirect to HTTPS with 301 (permanent redirect)
      return res.redirect(301, httpsUrl);
    }
  }

  // Continue to next middleware
  next();
}

module.exports = httpsRedirect;
