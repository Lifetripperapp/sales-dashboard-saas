const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Auth0 configuration
const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0Audience = process.env.AUTH0_AUDIENCE;

if (!auth0Domain || !auth0Audience) {
  console.error('Auth0 configuration missing. Please set AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables.');
}

// JWT validation middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
  }),
  audience: auth0Audience,
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256']
});

// Optional JWT validation middleware (doesn't fail if no token)
const checkJwtOptional = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
  }),
  audience: auth0Audience,
  issuer: `https://${auth0Domain}/`,
  algorithms: ['RS256'],
  credentialsRequired: false
});

// Error handler for JWT validation
const jwtErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    console.error('JWT validation failed:', err.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
  next(err);
};

// Get user info from JWT token
const getUserFromToken = (req) => {
  if (req.user) {
    return {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    };
  }
  return null;
};

module.exports = {
  checkJwt,
  checkJwtOptional,
  jwtErrorHandler,
  getUserFromToken
}; 