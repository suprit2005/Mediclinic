import api from './api';

export const subscriptionService = {
  /** Get the current subscription for the logged-in clinic admin */
  getCurrent: () => api.get('/subscriptions/current/'),

  /** Create a Stripe Checkout Session and return { url } */
  createCheckout: (plan: 'PROFESSIONAL' | 'ENTERPRISE') =>
    api.post('/subscriptions/create-checkout/', { plan }),

  /** Cancel the active subscription */
  cancel: () => api.post('/subscriptions/cancel/'),
};
