const express = require('express');
const { checkJwt } = require('../middleware/auth');
const { tenantMiddleware, featureMiddleware, limitMiddleware } = require('../middleware/tenant');
const { Tenant, TenantUser } = require('../models');
const stripeService = require('../services/stripe');

const router = express.Router();

/**
 * Create a new tenant
 */
router.post('/tenants', checkJwt, async (req, res) => {
  try {
    const { name, email, domain } = req.body;
    const user = req.user;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    // Check if user already has a tenant
    const existingTenantUser = await TenantUser.findOne({
      where: { auth0UserId: user.sub }
    });

    if (existingTenantUser) {
      return res.status(400).json({
        error: 'User already belongs to a tenant'
      });
    }

    // Create tenant
    const tenant = await Tenant.create({
      name,
      domain,
      plan: 'free',
      status: 'active'
    });

    // Create tenant user relationship
    await TenantUser.create({
      tenantId: tenant.id,
      auth0UserId: user.sub,
      email: user.email || email,
      role: 'admin',
      status: 'active'
    });

    // Create Stripe customer
    try {
      const customer = await stripeService.createCustomer({
        id: tenant.id,
        name: tenant.name,
        email: user.email || email
      });

      await tenant.update({
        stripeCustomerId: customer.id
      });
    } catch (stripeError) {
      console.error('Stripe customer creation failed:', stripeError);
      // Continue without Stripe customer for now
    }

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Get current tenant information
 */
router.get('/tenants/current', checkJwt, tenantMiddleware, async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantUser = req.tenantUser;

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        plan: tenant.plan,
        status: tenant.status,
        features: tenant.features,
        settings: tenant.settings,
        maxUsers: tenant.maxUsers,
        maxClients: tenant.maxClients
      },
      user: {
        role: tenantUser.role,
        status: tenantUser.status
      },
      limits: req.planLimits
    });
  } catch (error) {
    console.error('Error getting tenant info:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Update tenant settings
 */
router.put('/tenants/current', checkJwt, tenantMiddleware, async (req, res) => {
  try {
    const { name, domain, settings } = req.body;
    const tenant = req.tenant;
    const tenantUser = req.tenantUser;

    // Only admin can update tenant settings
    if (tenantUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Only administrators can update tenant settings'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (domain) updateData.domain = domain;
    if (settings) updateData.settings = { ...tenant.settings, ...settings };

    await tenant.update(updateData);

    res.json({
      message: 'Tenant updated successfully',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        settings: tenant.settings
      }
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Get tenant users
 */
router.get('/tenants/users', checkJwt, tenantMiddleware, async (req, res) => {
  try {
    const tenantUser = req.tenantUser;

    // Only admin and manager can view users
    if (!['admin', 'manager'].includes(tenantUser.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const users = await TenantUser.findAll({
      where: { tenantId: req.tenantId },
      attributes: ['id', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Error getting tenant users:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Invite user to tenant
 */
router.post('/tenants/users/invite', checkJwt, tenantMiddleware, limitMiddleware('users'), async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    const tenantUser = req.tenantUser;

    // Only admin can invite users
    if (tenantUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Only administrators can invite users'
      });
    }

    // Validate email
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user already exists in tenant
    const existingUser = await TenantUser.findOne({
      where: { 
        tenantId: req.tenantId,
        email: email.toLowerCase()
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists in this tenant'
      });
    }

    // Create invitation (in a real app, you'd send an email)
    const invitedUser = await TenantUser.create({
      tenantId: req.tenantId,
      email: email.toLowerCase(),
      role,
      status: 'inactive', // Will be activated when they accept invitation
      auth0UserId: null // Will be set when they accept
    });

    res.status(201).json({
      message: 'User invited successfully',
      user: {
        id: invitedUser.id,
        email: invitedUser.email,
        role: invitedUser.role,
        status: invitedUser.status
      }
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Create checkout session for subscription upgrade
 */
router.post('/tenants/subscription/checkout', checkJwt, tenantMiddleware, async (req, res) => {
  try {
    const { priceId } = req.body;
    const tenant = req.tenant;
    const tenantUser = req.tenantUser;

    // Only admin can manage subscriptions
    if (tenantUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Only administrators can manage subscriptions'
      });
    }

    if (!tenant.stripeCustomerId) {
      return res.status(400).json({
        error: 'Stripe customer not found. Please contact support.'
      });
    }

    const successUrl = `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/billing`;

    const session = await stripeService.createCheckoutSession(
      tenant.id,
      priceId,
      successUrl,
      cancelUrl
    );

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Create portal session for subscription management
 */
router.post('/tenants/subscription/portal', checkJwt, tenantMiddleware, async (req, res) => {
  try {
    const tenant = req.tenant;
    const tenantUser = req.tenantUser;

    // Only admin can manage subscriptions
    if (tenantUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Only administrators can manage subscriptions'
      });
    }

    if (!tenant.stripeCustomerId) {
      return res.status(400).json({
        error: 'No active subscription found'
      });
    }

    const returnUrl = `${process.env.FRONTEND_URL}/billing`;
    const session = await stripeService.createPortalSession(
      tenant.stripeCustomerId,
      returnUrl
    );

    res.json({
      url: session.url
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Stripe webhook handler
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router; 