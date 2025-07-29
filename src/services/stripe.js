const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe service for handling payments and subscriptions
 */
class StripeService {
  /**
   * Create a customer in Stripe
   */
  async createCustomer(tenantData) {
    try {
      const customer = await stripe.customers.create({
        email: tenantData.email,
        name: tenantData.name,
        metadata: {
          tenantId: tenantData.id
        }
      });
      
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a tenant
   */
  async createSubscription(customerId, priceId) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, priceId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
      });
      
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(tenantId, priceId, successUrl, cancelUrl) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: tenantId, // Will be updated with actual email
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenantId: tenantId
        }
      });
      
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create portal session for customer management
   */
  async createPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      
      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Handle subscription created event
   */
  async handleSubscriptionCreated(subscription) {
    const { Tenant } = require('../models');
    
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      const tenantId = customer.metadata.tenantId;
      
      // Update tenant with subscription info
      await Tenant.update({
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        plan: this.getPlanFromPriceId(subscription.items.data[0].price.id),
        status: 'active'
      }, {
        where: { id: tenantId }
      });
      
      console.log(`Subscription created for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handle subscription updated event
   */
  async handleSubscriptionUpdated(subscription) {
    const { Tenant } = require('../models');
    
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      const tenantId = customer.metadata.tenantId;
      
      // Update tenant plan
      await Tenant.update({
        plan: this.getPlanFromPriceId(subscription.items.data[0].price.id),
        status: subscription.status === 'active' ? 'active' : 'suspended'
      }, {
        where: { id: tenantId }
      });
      
      console.log(`Subscription updated for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deleted event
   */
  async handleSubscriptionDeleted(subscription) {
    const { Tenant } = require('../models');
    
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      const tenantId = customer.metadata.tenantId;
      
      // Update tenant status
      await Tenant.update({
        status: 'cancelled'
      }, {
        where: { id: tenantId }
      });
      
      console.log(`Subscription cancelled for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Handle payment succeeded
   */
  async handlePaymentSucceeded(invoice) {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
  }

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(invoice) {
    const { Tenant } = require('../models');
    
    try {
      const customer = await stripe.customers.retrieve(invoice.customer);
      const tenantId = customer.metadata.tenantId;
      
      // Update tenant status
      await Tenant.update({
        status: 'suspended'
      }, {
        where: { id: tenantId }
      });
      
      console.log(`Payment failed for tenant: ${tenantId}`);
    } catch (error) {
      console.error('Error handling payment failed:', error);
      throw error;
    }
  }

  /**
   * Get plan from Stripe price ID
   */
  getPlanFromPriceId(priceId) {
    const planMap = {
      'price_basic': 'basic',
      'price_premium': 'premium'
    };
    
    return planMap[priceId] || 'free';
  }
}

module.exports = new StripeService(); 