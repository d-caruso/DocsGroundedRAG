# Dynamically update payment amounts

Learn how to modify total amounts when customers change their selections during checkout.

Update the amount of a [Checkout Session](https://docs.stripe.com/api/checkout/sessions.md) or [Payment Intent](https://docs.stripe.com/api/payment_intents.md) when customers change what they’re buying or how much they pay. Recalculate the totals on your server, and then update the amount of the PaymentIntent.

#### Common use cases

- Add or remove add-ons (such as gift wrap or a warranty).
- Select a different shipping method or delivery speed.
- Add additional services or charges.
- Apply or remove a discount code or pre-tax store credit.

#### Security best practices

- Recalculate amounts on your server. Don’t trust client-provided prices or totals.
- Authorize the update based on your business rules (for example, enforce max quantities).
- Only update Sessions that are active and not completed or expired.

#### Constraints and behavior

- You can update the amount while the Payment Intent or Checkout Session is awaiting payment (for example, `requires_payment_method` or `requires_confirmation`).
- After confirmation, you generally can’t increase the amount.

# Checkout Sessions API

> This is a Checkout Sessions API for when payment-ui is embedded-components. View the full page at https://docs.stripe.com/payments/advanced/dynamically-update-amounts?payment-ui=embedded-components.

## Update the client SDK [Client-side]

When using Elements with the Checkout Sessions API, wrap client calls to your server in `runServerUpdate` so the checkout state and totals refresh.

#### HTML + JS

```javascript
import {loadStripe} from '@stripe/stripe-js';

// Optional: include beta flags if your integration requires them
const stripe = await loadStripe('<<YOUR_PUBLISHABLE_KEY>>', {
  betas: ['custom_checkout_server_updates_1'],
});

const checkout = stripe.initCheckoutElementsSdk({
  clientSecret,
  elementsOptions: {/* ... */},
});

// Example: Add additional service using price_data
const loadActionsResult = await checkout.loadActions();
if (loadActionsResult.type === 'success') {
  const actions = loadActionsResult.actions;
  const session = actions.getSession();
  document
  .getElementById('add-service')
  .addEventListener('click', async () => {
    const updateOnServer = () =>
      fetch('/update-custom-amount', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          checkout_session_id: session.id,
          product_id: 'gift_wrap', // Server looks up actual price
        }),
      });

    const response = await actions.runServerUpdate(updateOnServer);
    if (!response.ok) {
      // show error state
    }
  });
}
```

#### React

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js';

export const AddServiceButton = () => {
  const checkoutState = useCheckout();
  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
  const {runServerUpdate, id} = checkoutState;

  const addService = async () => {
    const updateOnServer = () =>
      fetch('/update-custom-amount', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          checkout_session_id: id,
          product_id: 'gift_wrap', // Server looks up actual price
        }),
      });

    const res = await runServerUpdate(updateOnServer);
    if (!res.ok) {
      // show error state
    }
  };

  return (
    <button onClick={addService}>
      Add Gift Wrap
    </button>
  );
};
```

## Create server endpoints [Server-side]

Calculate amounts and validate inputs on your server. Then, you can update `line_items` with [price_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data) to add ad-hoc charges.

> Updating the `line_items` or `price_data` recalculates the Session total and taxes.

#### Node

```node
import express from 'express';
import Stripe from 'stripe';

const app = express();
app.use(express.json());

// Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
const stripe = new Stripe('<<YOUR_SECRET_KEY>>');


// Product catalog with prices - store this securely server-side
const PRODUCTS = {
  gift_wrap: { name: 'Gift Wrap', price: 500 }, // $5.00
  express_shipping: { name: 'Express Shipping', price: 1500 }, // $15.00
  warranty: { name: 'Extended Warranty', price: 2000 }, // $20.00
};

app.post('/update-custom-amount', async (req, res) => {
  try {
    const {checkout_session_id, product_id} = req.body;

    const session = await stripe.checkout.sessions.retrieve(checkout_session_id);
    if (session.status === 'complete' || session.expires_at * 1000 < Date.now()) {
      return res.status(400).json({error: 'Session is no longer updatable.'});
    }

    // Look up product price server-side
    const product = PRODUCTS[product_id];
    if (!product) {
      return res.status(400).json({error: 'Invalid product ID'});
    }

    // Add the additional product via price_data
    const updated = await stripe.checkout.sessions.update(checkout_session_id, {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {name: product.name},
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
    });

    return res.json({id: updated.id, amount_total: updated.amount_total});
  } catch (err) {
    return res.status(400).json({error: err.message});
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
```


# Payment Intents API

> This is a Payment Intents API for when payment-ui is elements. View the full page at https://docs.stripe.com/payments/advanced/dynamically-update-amounts?payment-ui=elements.

## Recalculate and update the total on the server [Server-side]

To update the total amount:

1. Retrieve the changes to the cart or selection from the client.
1. Recalculate the new total amount on your server.
1. Update the PaymentIntent with the new amount.
1. Return the PaymentIntent (or its `client_secret`) to the client.

#### Node

```node
import express from 'express';
import Stripe from 'stripe';

const app = express();
app.use(express.json());
// Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
const stripe = new Stripe('<<YOUR_SECRET_KEY>>');

function computeOrderAmount(items, options = {}) {
  // ToDo: Your logic to compute an order total
}

app.post('/update-payment-intent', async (req, res) => {
  try {
    const {payment_intent_id, items, shipping_cents, service_cents, discount_cents} = req.body;

    // Compute amount on server
    const amount = computeOrderAmount(items, {shipping_cents, service_cents, discount_cents});

    // Update the amount if the PaymentIntent can be updated
    const pi = await stripe.paymentIntents.update(payment_intent_id, {
      amount,
    });

    return res.json({id: pi.id, amount: pi.amount, client_secret: pi.client_secret});
  } catch (err) {
    return res.status(400).json({error: err.message});
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));
```

## Update the client and confirm [Client-side]

> You’re responsible for keeping the client and server in sync.

After updating the PaymentIntent amount on the server, refresh the UI and confirm when the customer is ready.

