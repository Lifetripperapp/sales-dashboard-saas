const express = require('express');
const { checkJwt } = require('../middleware/auth');
const { TenantUser, Tenant } = require('../models');

const router = express.Router();

/**
 * Sincronizar usuario de Auth0 con Supabase
 */
router.post('/sync-user', checkJwt, async (req, res) => {
  try {
    const { auth0UserId, email, name, picture } = req.body;
    const user = req.user;

    // Verificar que el usuario de Auth0 coincide
    if (user.sub !== auth0UserId) {
      return res.status(403).json({
        error: 'Unauthorized - User mismatch'
      });
    }

    // Buscar usuario existente en Supabase
    let tenantUser = await TenantUser.findOne({
      where: { 
        auth0UserId: auth0UserId,
        status: 'active'
      },
      include: [{
        model: Tenant,
        as: 'tenant',
        where: { status: 'active' },
        required: true
      }]
    });

    // Si no existe, crear nuevo tenant y usuario
    if (!tenantUser) {
      // Crear tenant por defecto
      const tenant = await Tenant.create({
        name: `${name}'s Organization`,
        plan: 'free',
        status: 'active',
        features: {
          objectives: true,
          clientMatrix: true,
          dashboard: true,
          reports: false,
          api: false,
          customBranding: false
        },
        settings: {
          timezone: 'America/Montevideo',
          currency: 'UYU',
          language: 'es',
          dateFormat: 'DD/MM/YYYY'
        }
      });

      // Crear usuario en el tenant
      tenantUser = await TenantUser.create({
        tenantId: tenant.id,
        auth0UserId: auth0UserId,
        email: email,
        role: 'admin', // Primer usuario es admin
        status: 'active'
      });

      // Reload con tenant
      tenantUser = await TenantUser.findOne({
        where: { id: tenantUser.id },
        include: [{
          model: Tenant,
          as: 'tenant',
          required: true
        }]
      });
    }

    res.json({
      success: true,
      user: {
        id: tenantUser.id,
        email: tenantUser.email,
        role: tenantUser.role,
        status: tenantUser.status
      },
      tenant: {
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        plan: tenantUser.tenant.plan,
        status: tenantUser.tenant.status,
        features: tenantUser.tenant.features,
        settings: tenantUser.tenant.settings
      }
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

/**
 * Obtener información del usuario actual
 */
router.get('/me', checkJwt, async (req, res) => {
  try {
    const user = req.user;

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
      return res.status(404).json({
        error: 'User not found in any active tenant'
      });
    }

    res.json({
      user: {
        id: tenantUser.id,
        email: tenantUser.email,
        role: tenantUser.role,
        status: tenantUser.status
      },
      tenant: {
        id: tenantUser.tenant.id,
        name: tenantUser.tenant.name,
        plan: tenantUser.tenant.plan,
        status: tenantUser.tenant.status,
        features: tenantUser.tenant.features,
        settings: tenantUser.tenant.settings
      }
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router; 