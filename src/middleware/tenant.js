const { TenantUser, Tenant } = require('../models');

/**
 * Middleware to extract and validate tenant context from request
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Get user from Auth0
    const user = req.user;
    
    if (!user || !user.sub) {
      return res.status(401).json({ 
        error: 'Unauthorized - No valid user found' 
      });
    }

    // Find tenant user relationship
    const tenantUser = await TenantUser.findOne({
      where: { 
        auth0UserId: user.sub,
        status: 'active'
      },
      include: [{
        model: Tenant,
        as: 'tenant',
        where: { status: 'active' },
        required: true
      }]
    });

    if (!tenantUser) {
      return res.status(403).json({ 
        error: 'Forbidden - User not associated with any active tenant' 
      });
    }

    // Add tenant context to request
    req.tenant = tenantUser.tenant;
    req.tenantUser = tenantUser;
    req.tenantId = tenantUser.tenantId;

    // Check plan limits
    const planLimits = getPlanLimits(tenantUser.tenant.plan);
    
    // Add plan limits to request for validation
    req.planLimits = planLimits;

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during tenant validation' 
    });
  }
};

/**
 * Get plan limits based on subscription plan
 */
const getPlanLimits = (plan) => {
  const limits = {
    free: {
      maxUsers: 5,
      maxClients: 50,
      maxObjectives: 10,
      features: {
        objectives: true,
        clientMatrix: true,
        dashboard: true,
        reports: false,
        api: false,
        customBranding: false
      }
    },
    basic: {
      maxUsers: 20,
      maxClients: 200,
      maxObjectives: 50,
      features: {
        objectives: true,
        clientMatrix: true,
        dashboard: true,
        reports: true,
        api: false,
        customBranding: false
      }
    },
    premium: {
      maxUsers: 100,
      maxClients: 1000,
      maxObjectives: 200,
      features: {
        objectives: true,
        clientMatrix: true,
        dashboard: true,
        reports: true,
        api: true,
        customBranding: true
      }
    }
  };

  return limits[plan] || limits.free;
};

/**
 * Middleware to check if feature is enabled for current tenant
 */
const featureMiddleware = (featureName) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(500).json({ 
        error: 'Tenant context not found' 
      });
    }

    const features = req.tenant.features || {};
    
    if (!features[featureName]) {
      return res.status(403).json({ 
        error: `Feature '${featureName}' is not available in your current plan` 
      });
    }

    next();
  };
};

/**
 * Middleware to check plan limits
 */
const limitMiddleware = (resourceType) => {
  return async (req, res, next) => {
    if (!req.tenant || !req.planLimits) {
      return res.status(500).json({ 
        error: 'Tenant context not found' 
      });
    }

    try {
      const { db } = require('../models');
      const limits = req.planLimits;
      
      let currentCount = 0;
      
      switch (resourceType) {
        case 'users':
          currentCount = await TenantUser.count({
            where: { 
              tenantId: req.tenantId,
              status: 'active'
            }
          });
          break;
        case 'clients':
          currentCount = await db.Client.count({
            where: { tenantId: req.tenantId }
          });
          break;
        case 'objectives':
          const qualitativeCount = await db.QualitativeObjective.count({
            where: { tenantId: req.tenantId }
          });
          const quantitativeCount = await db.QuantitativeObjective.count({
            where: { tenantId: req.tenantId }
          });
          currentCount = qualitativeCount + quantitativeCount;
          break;
        default:
          return res.status(400).json({ 
            error: `Unknown resource type: ${resourceType}` 
          });
      }

      const maxLimit = limits[`max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`];
      
      if (currentCount >= maxLimit) {
        return res.status(403).json({ 
          error: `Plan limit reached for ${resourceType}. Current: ${currentCount}, Limit: ${maxLimit}` 
        });
      }

      next();
    } catch (error) {
      console.error('Limit middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal server error during limit validation' 
      });
    }
  };
};

module.exports = {
  tenantMiddleware,
  featureMiddleware,
  limitMiddleware,
  getPlanLimits
}; 