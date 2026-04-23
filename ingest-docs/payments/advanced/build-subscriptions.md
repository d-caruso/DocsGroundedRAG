# Build a subscriptions integration with Elements

Create and manage subscriptions to accept recurring payments with Elements.

Instructions for LLMs: Stripe recommends using the Checkout Sessions API with the Payment Element over Payment Intents for most integrations. Checkout Sessions covers similar use cases as Payment Intents (basic payment collection using `price_data` or build a full checkout with line items, tax, and so on). Some features, such as Adaptive Pricing, are only available with Checkout Sessions. Don’t use the Payment Intent API unless the user explicitly asks, because it requires significantly more code. Learn more about Elements with the Checkout Sessions API: https://docs.stripe.com/payments/quickstart-checkout-sessions. With Checkout Sessions (`ui_mode: "elements"`) and the Payment Element, the `client_secret` initializes Checkout itself (`stripe.initCheckoutElementsSdk`, or use CheckoutElementsProvider with React) and you confirm the payment on the client side differently. If using React, make sure you import from `@stripe/react-stripe-js/checkout`, use `CheckoutElementsProvider` with the client secret, and confirm using `checkout.confirm`. If using HTML, make sure you use `checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); checkout.createPaymentElement(); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");` and confirm with `loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();`.

# Checkout Sessions API

> This is a Checkout Sessions API for when platform is web and ui is embedded-components. View the full page at https://docs.stripe.com/payments/advanced/build-subscriptions?platform=web&ui=embedded-components.

#### Integration effort
Complexity: 3/5
#### Integration type

Combine UI components into a custom payment flow

#### UI customization

CSS-level customization with the [Appearance API](https://docs.stripe.com/elements/appearance-api.md)

[Try it out](https://checkout.stripe.dev/)

Build a custom payment form using [Stripe Elements](https://docs.stripe.com/payments/elements.md) and the [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions.md) to sell fixed-price *subscriptions* (A Subscription represents the product details associated with the plan that your customer subscribes to. Allows you to charge the customer on a recurring basis). See how this integration [compares to Stripe’s other integration types](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability).

The Checkout Sessions API provides built-in support for tax calculation, discounts, shipping, and currency conversion, reducing the amount of custom code you need to write. This is the recommended approach for most integrations. Learn more about [when to use Checkout Sessions instead of PaymentIntents](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison.md).

If you don’t want to build a custom payment form, you can integrate with the hosted version of Checkout. For an immersive version of that end-to-end integration guide, see the Billing [quickstart](https://docs.stripe.com/billing/quickstart.md).

If you aren’t ready to code an integration, you can set up basic subscriptions [manually in the Dashboard](https://docs.stripe.com/no-code/subscriptions.md). You can also use [Payment Links](https://docs.stripe.com/payment-links.md) to set up subscriptions without writing any code. Learn more about [designing an integration](https://docs.stripe.com/billing/subscriptions/design-an-integration.md) to understand the decisions you need to make and the resources you need.

## What you’ll build 

This guide shows you how to:

- Model your business by building a product catalog.
- Build a registration process that creates a customer.
- Create subscriptions and collect payment information.
- Test and monitor payment and subscription status.
- Let customers change their plan or cancel the subscription.

### API object definitions

| Resource                                                                                                                             | Definition                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Account configured as a customer](https://docs.stripe.com/api/v2/core/accounts/create.md#v2_create_accounts-configuration-customer) | Represents a customer in the Accounts v2 API who purchases a subscription. Configure an `Account` object as a customer and associate it with a subscription to make and track recurring charges and to manage the products that they subscribe to. For more information, see the [Use Accounts as customers guide](https://docs.stripe.com/connect/use-accounts-as-customers.md).                             |
| [Customer](https://docs.stripe.com/api/customers.md)                                                                                 | Represents a customer in the Customers API who purchases a subscription. Use the `Customer` object associated with a subscription to make and track recurring charges and to manage the products that they subscribe to.                                                                                                                                                                                      |
| [Entitlement](https://docs.stripe.com/api/entitlements/active-entitlement.md)                                                        | Represents a customer’s access to a feature included in a service product that they subscribe to. When you create a subscription for a customer’s recurring purchase of a product, an active entitlement is automatically created for each feature associated with that product. When a customer accesses your services, use their active entitlements to enable the features included in their subscription. |
| [Feature](https://docs.stripe.com/api/entitlements/feature.md)                                                                       | Represents a function or ability that your customers can access when they subscribe to a service product. You can include features in a product by creating ProductFeatures.                                                                                                                                                                                                                                  |
| [Invoice](https://docs.stripe.com/api/invoices.md)                                                                                   | A statement of amounts a customer owes that tracks payment statuses from draft through paid or otherwise finalized. Subscriptions automatically generate invoices.                                                                                                                                                                                                                                            |
| [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)                                                                      | A way to build dynamic payment flows. A PaymentIntent tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods. Invoices automatically create PaymentIntents.                                                                                                          |
| [PaymentMethod](https://docs.stripe.com/api/payment_methods.md)                                                                      | A customer’s payment methods that they use to pay for your products. For example, you can store a credit card on a customer-configured `Account` or `Customer` object and use it to make recurring payments for that customer. Typically used with the Payment Intents or Setup Intents APIs.                                                                                                                 |
| [Price](https://docs.stripe.com/api/prices.md)                                                                                       | Defines the unit price, currency, and billing cycle for a product.                                                                                                                                                                                                                                                                                                                                            |
| [Product](https://docs.stripe.com/api/products.md)                                                                                   | A good or service that your business sells. A service product can include one or more features.                                                                                                                                                                                                                                                                                                               |
| [ProductFeature](https://docs.stripe.com/api/product-feature.md)                                                                     | Represents a single feature’s inclusion in a single product. Each product is associated with a ProductFeature for each feature that it includes, and each feature is associated with a ProductFeature for each product that includes it.                                                                                                                                                                      |
| [Subscription](https://docs.stripe.com/api/subscriptions.md)                                                                         | Represents a customer’s scheduled recurring purchase of a product. Use a subscription to collect payments and provide repeated delivery of or continuous access to a product.                                                                                                                                                                                                                                 |

Here’s an example of how products, features, and entitlements work together. Imagine that you want to set up a recurring service that offers two tiers: a standard product with basic functionality, and an advanced product that adds extended functionality.

1. You create two features: `basic_features` and `extended_features`.
1. You create two products: `standard_product` and `advanced_product`.
1. For the standard product, you create one ProductFeature that associates `basic_features` with `standard_product`.
1. For the advanced product, you create two ProductFeatures: one that associates `basic_features` with `advanced_product` and one that associates `extended_features` with `advanced_product`.

A customer, `first_customer`, subscribes to the standard product. When you create the subscription, Stripe automatically creates an Entitlement that associates `first_customer` with `basic_features`.

Another customer, `second_customer`, subscribes to the advanced product. When you create the Subscription, Stripe automatically creates two Entitlements: one that associates `second_customer` with `basic_features`, and one that associates `second_customer` with `extended_features`.

You can determine which features to provision for a customer by [retrieving their active entitlements or listening to the Active Entitlement Summary event](https://docs.stripe.com/billing/entitlements.md#entitlements). You don’t have to retrieve their subscriptions, products, and features.

## Set up Stripe

Install the Stripe client of your choice:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

And then install the Stripe CLI. The CLI provides webhook testing and you can run it to make API calls to Stripe. This guide shows how to use the CLI to set up a pricing model in a later section.
For additional install options, see [Get started with the Stripe CLI](https://docs.stripe.com/stripe-cli.md).
## Create the pricing model [Stripe CLI or Dashboard]

[Recurring pricing models](https://docs.stripe.com/products-prices/pricing-models.md) represent the products or services you sell, how much they cost, what currency you accept for payments, and the service period for subscriptions. To build the pricing model, create [products](https://docs.stripe.com/api/products.md) (what you sell) and [prices](https://docs.stripe.com/api/prices.md) (how much and how often to charge for your products).

This example uses flat-rate pricing with two different service-level options: Basic and Premium. For each service-level option, you need to create a product and a recurring price. To add a one-time charge for something like a setup fee, create a third product with a one-time price.

Each product bills at monthly intervals. The price for the Basic product is 5 USD. The price for the Premium product is 15 USD. See the [flat rate pricing](https://docs.stripe.com/subscriptions/pricing-models/flat-rate-pricing.md) guide for an example with three tiers.

#### Dashboard

Go to the [Add a product](https://dashboard.stripe.com/test/products/create) page and create two products. Add one price for each product, each with a monthly recurring billing period:

- Premium product: Premium service with extra features

  - Price: Flat rate | 15 USD

- Basic product: Basic service with minimum features

  - Price: Flat rate | 5 USD

After you create the prices, record the price IDs so you can use them in other  steps. Price IDs look like this: `price_G0FvDp6vZvdwRZ`.

When you’re ready, use the **Copy to live mode** button at the top right of the page to clone your product from [a sandbox to live mode](https://docs.stripe.com/keys.md#test-live-modes).

#### API

You can use the API to create the [Products](https://docs.stripe.com/api/products.md) and [Prices](https://docs.stripe.com/api/prices.md).

Create the Premium product:

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "name=Billing Guide: Premium Service" \
  -d "description=Premium service with extra features"
```

Create the Basic product:

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "name=Billing Guide: Basic Service" \
  -d "description=Basic service with minimum features"
```

Record the product ID for each product. They look like this:

```json
{
  "id": "prod_H94k5odtwJXMtQ",
  "object": "product",
  "active": true,
  "attributes": [

  ],
  "created": 1587577341,
  "description": "Premium service with extra features",
  "images": [

  ],
  "livemode": false,
  "metadata": {
  },
  "name": "Billing Guide: Premium Service",
  "statement_descriptor": null,
  "type": "service",
  "unit_label": null,
  "updated": 1587577341
}
```

Use the product IDs to create a price for each product. The [unit_amount](https://docs.stripe.com/api/prices/object.md#price_object-unit_amount) number is in cents, so `1500` = 15 USD, for example.

Create the Premium price:

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d product={{PREMIUM_PRODUCT_ID}} \
  -d unit_amount=1500 \
  -d currency=eur \
  -d "recurring[interval]=month"
```

Create the Basic price:

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d product={{BASIC_PRODUCT_ID}} \
  -d unit_amount=500 \
  -d currency=eur \
  -d "recurring[interval]=month"
```

Record the price ID for each price so you can use them in subsequent steps. They look like this:

```json
{
  "id": "price_HGd7M3DV3IMXkC",
  "object": "price",
  "product": "prod_HGd6W1VUqqXGvr",
  "type": "recurring",
  "currency": "usd",
  "recurring": {
    "interval": "month",
    "interval_count": 1,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1589319695,
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "unit_amount": 1500,
  "unit_amount_decimal": "1500",
  "tiers": null,
  "tiers_mode": null,
  "transform_quantity": null
}
```

## Create the customer [Client and Server]

Stripe needs a customer for each subscription. In your application front end, collect any necessary information from your users and pass it to the back end.

If you need to collect address details, the Address Element enables you to collect a shipping or billing address for your customers. For more information on the Address Element, see the [Address Element](https://docs.stripe.com/elements/address-element.md) page.

```html
<form id="signup-form">
  <label>
    Email
    <input id="email" type="email" placeholder="Email address" value="test@example.com" required />
  </label>

  <button type="submit">
    Register
  </button>
</form>
```

```javascript
const emailInput = document.querySelector('#email');

fetch('/create-customer', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: emailInput.value,
  }),
}).then(r => r.json());
```

On the server, create an object to represent the customer. This can be either a customer-configured `Account` object or a `Customer` object. Save the object’s ID to use in the Checkout Session.

> #### Use the Accounts v2 API to represent customers
> 
> The Accounts v2 API is generally available for Connect users, and in public preview for other Stripe users. If you’re part of the Accounts v2 preview, you need to specify a [specify a preview version](https://docs.stripe.com/api-v2-overview.md#sdk-and-api-versioning) in your code.
> 
> To request access to the Accounts v2 preview, 
> 
> For most use cases, we recommend [modeling your customers as customer-configured Account objects](https://docs.stripe.com/connect/use-accounts-as-customers.md) instead of using [Customer](https://docs.stripe.com/api/customers.md) objects.

#### Accounts v2

```curl
curl -X POST https://api.stripe.com/v2/core/accounts \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2026-03-25.preview" \
  --json '{
    "contact_email": "jenny.rosen@example.com",
    "display_name": "Jenny Rosen",
    "identity": {
        "individual": {
            "given_name": "Jenny Rosen",
            "address": {
                "city": "San Francisco",
                "country": "US",
                "line1": "123 Main Street",
                "postal_code": "94605",
                "state": "CA"
            }
        }
    },
    "configuration": {
        "customer": {
            "capabilities": {
                "automatic_indirect_tax": {
                    "requested": true
                }
            },
            "shipping": {
                "address": {
                    "city": "San Francisco",
                    "country": "US",
                    "line1": "123 Main Street",
                    "postal_code": "94605",
                    "state": "CA"
                }
            }
        }
    },
    "include": [
        "configuration.customer",
        "identity"
    ]
  }'
```

#### Customers v1

```curl
curl https://api.stripe.com/v1/customers \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "email=jenny.rosen@example.com" \
  -d "name=Jenny Rosen" \
  -d "shipping[address][city]=San Francisco" \
  -d "shipping[address][country]=US" \
  -d "shipping[address][line1]=123 Main Street" \
  -d "shipping[address][postal_code]=9460" \
  -d "shipping[address][state]=CA" \
  -d "shipping[name]=Jenny Rosen" \
  -d "address[city]=San Francisco" \
  -d "address[country]=US" \
  -d "address[line1]=123 Main Street" \
  -d "address[postal_code]=9460" \
  -d "address[state]=CA"
```

## Create a Checkout Session [Server]

On the back end of your application, define an endpoint that [creates the session](https://docs.stripe.com/api/checkout/sessions/create.md) for your front end to call. You’ll need the price ID of the subscription the customer is signing up for—your front end passes this value.

If you created a one-time price in [step 2](https://docs.stripe.com/billing/subscriptions/build-subscriptions.md#create-pricing-model), pass that price ID also. After creating a Checkout Session, make sure you pass the [client secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) back to the client in the response.

> You can use [lookup_keys](https://docs.stripe.com/products-prices/manage-prices.md#lookup-keys) to fetch prices rather than Price IDs. See the [sample application](https://github.com/stripe-samples/subscription-use-cases/tree/main/fixed-price-subscriptions) for an example.

#### Accounts v2

#### Ruby

```ruby
require 'stripe'
require 'sinatra'

# This test secret API key is a placeholder. Don't include personal details in requests with this key.
# To see your test secret API key embedded in code samples, sign in to your Stripe account.
# You can also find your test secret API key at https://dashboard.stripe.com/test/apikeys.
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
Stripe.api_key = '<<YOUR_SECRET_KEY>>'
Stripe.api_version = '2026-03-25.dahlia'

set :static, true
set :port, 4242

YOUR_DOMAIN = 'http://localhost:3000'

post '/create-checkout-session' do
  content_type 'application/json'

  session = Stripe::Checkout::Session.create({ui_mode: 'elements',
    # Provide the Account ID of the account you previously created
    customer_account: '{{CUSTOMER_ACCOUNT_ID}}',
    line_items: [{
      # Provide the exact Price ID (for example, price_1234) of the product you want to sell
      price: '{{PRICE_ID}}',
      quantity: 1,
    }],
    mode: 'subscription',
    return_url: YOUR_DOMAIN + '/return?session_id={CHECKOUT_SESSION_ID}',
  })

  { clientSecret: session.client_secret }.to_json
end

```

#### Customers v1

#### Ruby

```ruby
require 'stripe'
require 'sinatra'

# This test secret API key is a placeholder. Don't include personal details in requests with this key.
# To see your test secret API key embedded in code samples, sign in to your Stripe account.
# You can also find your test secret API key at https://dashboard.stripe.com/test/apikeys.
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>', stripe_version: '2026-03-25.dahlia')

set :static, true
set :port, 4242

YOUR_DOMAIN = 'http://localhost:3000'

post '/create-checkout-session' do
  content_type 'application/json'

  session = client.v1.checkout.sessions.create({ui_mode: 'elements',
    # Provide the customer ID of the customer you previously created
    customer: '{{CUSTOMER_ID}}',
    line_items: [{
      # Provide the exact Price ID (for example, price_1234) of the product you want to sell
      price: '{{PRICE_ID}}',
      quantity: 1,
    }],
    mode: 'subscription',
    return_url: YOUR_DOMAIN + '/return?session_id={CHECKOUT_SESSION_ID}',
  })

  { clientSecret: session.client_secret }.to_json
end

```

From your [Dashboard](https://dashboard.stripe.com/settings/payment_methods), enable the payment methods you want to accept from your customers. Checkout supports [several payment methods](https://docs.stripe.com/payments/payment-methods/payment-method-support.md#product-support).

## Initialize Checkout [Client]

#### HTML + JS

Call [initCheckoutElementsSdk](https://docs.stripe.com/js/custom_checkout/init), passing in `clientSecret`.

`initCheckoutElementsSdk` returns a [Checkout](https://docs.stripe.com/js/custom_checkout) object that contains data from the Checkout Session and methods to update it.

Read the `total` and `lineItems` from [actions.getSession()](https://docs.stripe.com/js/custom_checkout/session), and display them in your UI. This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

```html
<div id="checkout-container"></div>
```

```javascript
const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
  .then((response) => response.json())
  .then((json) => json.client_secret);

const checkout = stripe.initCheckoutElementsSdk({clientSecret});
const loadActionsResult = await checkout.loadActions();

if (loadActionsResult.type === 'success') {
  const session = loadActionsResult.actions.getSession();
  const checkoutContainer = document.getElementById('checkout-container');

  checkoutContainer.append(JSON.stringify(session.lineItems, null, 2));
  checkoutContainer.append(document.createElement('br'));
  checkoutContainer.append(`Total: ${session.total.total.amount}`);
}
```

#### React

Wrap your application with the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider) component, passing in `clientSecret` and the `stripe` instance.

```jsx
import React from 'react';
import {CheckoutElementsProvider} from '@stripe/react-stripe-js/checkout';
import CheckoutForm from './CheckoutForm';

const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
  .then((response) => response.json())
  .then((json) => json.client_secret);

const App = () => {
  return (
    <CheckoutElementsProvider
      stripe={stripe}options={{clientSecret}}
    >
      <CheckoutForm />
    </CheckoutElementsProvider>
  );
};

export default App;
```

Access the [Checkout](https://docs.stripe.com/js/custom_checkout) object in your checkout form component by using the `useCheckout()` hook. The `Checkout` object contains data from the Checkout Session and methods to update it.

Read the `total` and `lineItems` from the `Checkout` object, and display them in your UI. This lets you enable features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  }

  if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }

  return (
    <form>{JSON.stringify(checkoutState.checkout.lineItems, null, 2)}
      {/* A formatted total amount */}
      Total: {checkoutState.checkout.total.total.amount}
    </form>
  );
};
```

## Collect payment information [Client]

Collect payment details on the client with the [Payment Element](https://docs.stripe.com/payments/payment-element.md). The Payment Element is a prebuilt UI component that simplifies collecting payment details for a variety of payment methods.

The Payment Element contains an iframe that securely sends payment information to Stripe over an HTTPS connection. Avoid placing the Payment Element within another iframe because some payment methods require redirecting to another page for payment confirmation.

If you choose to use an iframe and want to accept Apple Pay or Google Pay, the iframe must have the [allow](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-allowpaymentrequest) attribute set to equal `"payment *"`.

The checkout page address must start with `https://` rather than `http://` for your integration to work. You can test your integration without using HTTPS, but remember to [enable it](https://docs.stripe.com/security/guide.md#tls) when you’re ready to accept live payments.

#### HTML + JS

First, create a container DOM element to mount the [Payment Element](https://docs.stripe.com/payments/payment-element.md). Then create an instance of the `Payment Element` using [checkout.createPaymentElement](https://docs.stripe.com/js/custom_checkout/create_payment_element) and mount it by calling [element.mount](https://docs.stripe.com/js/element/mount), providing either a CSS selector or the container DOM element.

```html
<div id="payment-element"></div>
```

```javascript
const paymentElement = checkout.createPaymentElement();
paymentElement.mount('#payment-element');
```

See the [Stripe.js docs](https://docs.stripe.com/js/custom_checkout/create_payment_element#custom_checkout_create_payment_element-options) to view the supported options.

You can [customize the appearance](https://docs.stripe.com/payments/checkout/customization/appearance.md) of all Elements by passing [elementsOptions.appearance](https://docs.stripe.com/js/custom_checkout/init#custom_checkout_init-options-elementsOptions-appearance) when initializing Checkout on the front end.

#### React

Mount the [Payment Element](https://docs.stripe.com/payments/payment-element.md) component within the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider).

```jsx
import React from 'react';import {PaymentElement, useCheckout} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {
  const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  }

  if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }

  return (
    <form>

      {JSON.stringify(checkoutState.checkout.lineItems, null, 2)}
      {/* A formatted total amount */}
      Total: {checkoutState.checkout.total.total.amount}
<PaymentElement options={{layout: 'accordion'}}/>
    </form>
  );
};

export default CheckoutForm;
```

See the [Stripe.js docs](https://docs.stripe.com/js/custom_checkout/create_payment_element#custom_checkout_create_payment_element-options) to view the supported options.

You can [customize the appearance](https://docs.stripe.com/payments/checkout/customization/appearance.md) of all Elements by passing [elementsOptions.appearance](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider#react_checkout_provider-options-elementsOptions-appearance) to the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider).

## Submit the payment [Client-side]

#### HTML + JS

Render a **Pay** button that calls [confirm](https://docs.stripe.com/js/custom_checkout/confirm) from the `Checkout` instance to submit the payment.

```html
<button id="pay-button">Pay</button>
<div id="confirm-errors"></div>
```

```js
const checkout = stripe.initCheckoutElementsSdk({clientSecret});

checkout.on('change', (session) => {
  document.getElementById('pay-button').disabled = !session.canConfirm;
});

const loadActionsResult = await checkout.loadActions();

if (loadActionsResult.type === 'success') {
  const {actions} = loadActionsResult;
  const button = document.getElementById('pay-button');
  const errors = document.getElementById('confirm-errors');
  button.addEventListener('click', () => {
    // Clear any validation errors
    errors.textContent = '';

    actions.confirm().then((result) => {
      if (result.type === 'error') {
        errors.textContent = result.error.message;
      }
    });
  });
}
```

#### React

Render a **Pay** button that calls [confirm](https://docs.stripe.com/js/custom_checkout/confirm) from [useCheckout](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout) to submit the payment.

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const PayButton = () => {
  const checkoutState = useCheckout();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  if (checkoutState.type !== "success") {
    return null;
  }

  const handleClick = () => {
    setLoading(true);checkoutState.checkout.confirm().then((result) => {
      if (result.type === 'error') {
        setError(result.error)
      }
      setLoading(false);
    })
  };

  return (
    <div>
      <button disabled={!checkoutState.checkout.canConfirm || loading} onClick={handleClick}>
        Pay
      </button>
      {error && <div>{error.message}</div>}
    </div>
  )
};

export default PayButton;
```

## Listen for webhooks [Server]

To complete the integration, you need to process *webhooks* (A webhook is a real-time push notification sent to your application as a JSON payload through HTTPS requests) sent by Stripe. These events are triggered whenever the status in Stripe changes, such as subscriptions creating new invoices. In your application, set up an HTTP handler to accept a POST request containing the webhook event, and verify the signature of the event:

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/webhook' do
  # You can use webhooks to receive information about asynchronous payment events.
  # For more about our webhook events check out https://stripe.com/docs/webhooks.
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
  payload = request.body.read
  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts '⚠️  Webhook signature verification failed.'
      status 400
      return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end
  # Get the type of webhook event sent - used to check the status of PaymentIntents.
  event_type = event['type']
  data = event['data']
  data_object = data['object']

  if event_type == 'invoice.paid'
    # Used to provision services after the trial has ended.
    # The status of the invoice will show up as paid. Store the status in your
    # database to reference when a user accesses your service to avoid hitting rate
    # limits.
    # puts data_object
  end

  if event_type == 'invoice.payment_failed'
    # If the payment fails or the customer doesn't have a valid payment method,
    # an invoice.payment_failed event is sent, the subscription becomes past_due.
    # Use this webhook to notify your user that their payment has
    # failed and to retrieve new card details.
    # puts data_object
  end

  if event_type == 'customer.subscription.deleted'
    # handle subscription canceled automatically based
    # upon your subscription settings. Or if the user cancels it.
    # puts data_object
  end

  content_type 'application/json'
  { status: 'success' }.to_json
end
```

During development, use the Stripe CLI to [observe webhooks and forward them to your application](https://docs.stripe.com/webhooks.md#test-webhook). Run the following in a new terminal while your development app is running:

#### curl

```bash
  stripe listen --forward-to localhost:4242/webhook
```

For production, set up a webhook endpoint URL in the Dashboard, or use the [Webhook Endpoints API](https://docs.stripe.com/api/webhook_endpoints.md).

You need to listen to a few events to complete the remaining steps in this guide. See [Subscription events](https://docs.stripe.com/billing/subscriptions/webhooks.md#events) for more details about subscription-specific webhooks.

## Provision access to your service [Client and Server]

Now that the subscription is active, give your user access to your service. To do this, listen to the `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` events. These events pass a subscription object that contains a `status` field indicating whether the subscription is active, past due, or canceled. See [the subscription lifecycle](https://docs.stripe.com/billing/subscriptions/overview.md#subscription-lifecycle) for a complete list of statuses.

In your webhook handler:

1. Verify the subscription status. If it’s `active` then your user has paid for your product.
1. Check the product the customer subscribed to and grant access to your service. Checking the product instead of the price gives you more flexibility if you need to change the pricing or billing period.
1. Store the `product.id`, `subscription.id` and `subscription.status` in your database along with either the `customer_account.id` or the `customer.id` you already saved. Check this record when determining which features to enable for the user in your application.

The status of a subscription might change at any point during its lifetime, even if your application doesn’t directly make any calls to Stripe. For example, a renewal might fail because of an expired credit card, which puts the subscription into a past due status. Or, if you implement the [customer portal](https://docs.stripe.com/customer-management.md), a user might cancel their subscription without directly visiting your application. Implementing your handler correctly keeps your application status in sync with Stripe.

## Cancel the subscription [Client and Server]

It’s common to allow customers to cancel their subscriptions. This example adds a cancellation option to the account settings page.
![Sample subscription cancelation interface.](https://b.stripecdn.com/docs-statics-srv/assets/fixed-price-subscriptions-guide-account-settings.6559626ba4b434826a67abfea165e097.png)

Account settings with the ability to cancel the subscription

```javascript
function cancelSubscription(subscriptionId) {
  return fetch('/cancel-subscription', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then(cancelSubscriptionResponse => {
      // Display to the user that the subscription has been canceled.
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/cancel-subscription' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  deleted_subscription = client.v1.subscriptions.cancel(data['subscriptionId'])

  deleted_subscription.to_json
end
```

Your application receives a `customer.subscription.deleted` event.

After the subscription cancels, update your database to remove the Stripe subscription ID you previously stored, and limit access to your service.

When a subscription cancels, you can’t reactivate it. Instead, collect updated billing information from your customer, update their default payment method, and create a new subscription with their existing customer record.

## Test your integration

### Test payment methods

Use the following table to test different payment methods and scenarios.

| Payment method    | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit | Your customer successfully pays with BECS Direct Debit.                                                                                                                                                                                                                                       | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status three minutes later. |
| BECS Direct Debit | Your customer’s payment fails with an `account_closed` error code.                                                                                                                                                                                                                            | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                    |
| Credit card       | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number `4242 4242 4242 4242` with any expiration, CVC, and postal code.                                                                                 |
| Credit card       | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number `4000 0025 0000 3155` with any expiration, CVC, and postal code.                                                                                 |
| Credit card       | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number `4000 0000 0000 9995` with any expiration, CVC, and postal code.                                                                                 |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                                                                                                                                                                                                                       | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later.           |
| SEPA Direct Debit | Your customer’s PaymentIntent status transitions from `processing` to `requires_payment_method`.                                                                                                                                                                                              | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                          |

### Monitor events

Set up webhooks to listen to subscription change events, such as upgrades and cancellations. Learn more about [subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks.md). You can view events in the [Dashboard](https://dashboard.stripe.com/test/events) or with the [Stripe CLI](https://docs.stripe.com/webhooks.md#test-webhook).

For more details, see [testing your Billing integration](https://docs.stripe.com/billing/testing.md).

## Optional: Let customers change their plans [Client and Server]

To let your customers change their subscription, collect the price ID of the option they want to change to. Then send the new price ID from the front end to a back-end endpoint. This example also passes the subscription ID, but you can retrieve it from your database for your logged in user.

```javascript
function updateSubscription(priceId, subscriptionId) {
  return fetch('/update-subscription', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
      newPriceId: priceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then(response => {
      return response;
    });
}
```

On the backend, define the endpoint for your frontend to call, passing the subscription ID and the new price ID. The subscription is now Premium, at 15 USD per month, instead of Basic at 5 USD per month.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/update-subscription' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = client.v1.subscriptions.retrieve(data['subscriptionId'])

  updated_subscription =
    client.v1.subscriptions.update(
      data['subscriptionId'],
      cancel_at_period_end: false,
      items: [
        { id: subscription.items.data[0].id, price: data['newPriceId'] }
      ]
    )

  updated_subscription.to_json
end
```

Your application receives a `customer.subscription.updated` event.

## Optional: Preview a price change [Client and Server]

When your customer changes their subscription, there’s often an adjustment to the amount they owe, known as a [proration](https://docs.stripe.com/billing/subscriptions/prorations.md). You can use the [create preview invoice endpoint](https://docs.stripe.com/api/invoices/create_preview.md) to display the adjusted amount to your customers.

On the front end, pass the create preview invoice details to a back-end endpoint.

#### Accounts v2

```javascript
function createPreviewInvoice(
  customerAccountId,
  subscriptionId,
  newPriceId,
  trialEndDate
) {
  return fetch('/create-preview-invoice', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      customerAccountId: customerAccountId,
      subscriptionId: subscriptionId,
      newPriceId: newPriceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then((invoice) => {
      return invoice;
    });
}
```

#### Customers v1

```javascript
function createPreviewInvoice(
  customerId,
  subscriptionId,
  newPriceId,
  trialEndDate
) {
  return fetch('/create-preview-invoice', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customerId,
      subscriptionId: subscriptionId,
      newPriceId: newPriceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then((invoice) => {
      return invoice;
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Accounts v2

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/create-preview-invoice' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = Stripe::Subscription.retrieve(data['subscriptionId'])

  invoice =
    Stripe::Invoice.create_preview(
      customer_account: data['customerAccountId'],
      subscription: data['subscriptionId'],
      subscription_details: {
        items: [
          { id: subscription.items.data[0].id, deleted: true },
          { price: data['newPriceId'], deleted: false }
        ]
      }
    )

  invoice.to_json
end
```

#### Customers v1

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/create-preview-invoice' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = client.v1.subscriptions.retrieve(data['subscriptionId'])

  invoice =
    client.v1.invoices.create_preview(
      customer: data['customerId'],
      subscription: data['subscriptionId'],
      subscription_details: {
        items: [
          { id: subscription.items.data[0].id, deleted: true },
          { price: data['newPriceId'], deleted: false }
        ]
      }
    )

  invoice.to_json
end
```

## Optional: Display the customer payment method [Client and Server]

Displaying the brand and last four digits of your customer’s card can help them know which card is being charged, or if they need to update their payment method.

On the front end, send the payment method ID to a back-end endpoint that retrieves the payment method details.

```javascript
function retrieveCustomerPaymentMethod(paymentMethodId) {
  return fetch('/retrieve-customer-payment-method', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId: paymentMethodId,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      return response;
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/retrieve-customer-payment-method' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  payment_method = client.v1.payment_methods.retrieve(data['paymentMethodId'])

  payment_method.to_json
end
```

Example response:

```json
{
  "id": "pm_1GcbHY2eZvKYlo2CoqlVxo42",
  "object": "payment_method",
  "billing_details": {
    "address": {
      "city": null,
      "country": null,
      "line1": null,
      "line2": null,
      "postal_code": null,
      "state": null
    },
    "email": null,
    "name": null,
    "phone": null
  },
  "card": {
    "brand": "visa",
    "checks": {
      "address_line1_check": null,
      "address_postal_code_check": null,
      "cvc_check": "pass"
    },
    "country": "US",
    "exp_month": 8,
    "exp_year": 2021,
    "fingerprint": "Xt5EWLLDS7FJjR1c",
    "funding": "credit",
    "generated_from": null,
    "last4": "4242",
    "three_d_secure_usage": {
      "supported": true
    },
    "wallet": null
  },
  "created": 1588010536,
  "customer": "cus_HAxB7dVQxhoKLh",
  "livemode": false,
  "metadata": {},
  "type": "card"
}
```

> We recommend that you save the `paymentMethod.id` and `last4` in your database, for example, `paymentMethod.id` as `stripeCustomerPaymentMethodId` in your `users` collection or table. You can optionally store `exp_month`, `exp_year`, `fingerprint`, `billing_details` as needed. This is to limit the number of calls you make to Stripe, for performance efficiency and to avoid possible rate limiting.

## Disclose Stripe to your customers 

Stripe collects information on customer interactions with Elements to provide services to you, prevent fraud, and improve its services. This includes using cookies and IP addresses to identify which Elements a customer saw during a single checkout session. You’re responsible for disclosing and obtaining all rights and consents necessary for Stripe to use data in these ways. For more information, visit our [privacy center](https://stripe.com/legal/privacy-center#as-a-business-user-what-notice-do-i-provide-to-my-end-customers-about-stripe).


# Payment Intents API

> This is a Payment Intents API for when platform is web and ui is elements. View the full page at https://docs.stripe.com/payments/advanced/build-subscriptions?platform=web&ui=elements.

#### Integration effort
Complexity: 4/5
#### Integration type

Combine UI components into a custom payment flow

#### UI customization

CSS-level customization with the [Appearance API](https://docs.stripe.com/elements/appearance-api.md)

Build a custom payment form using [Stripe Elements](https://docs.stripe.com/payments/elements.md) and the [Payment Intents API](https://docs.stripe.com/api/payment_intents.md) to sell fixed-price *subscriptions* (A Subscription represents the product details associated with the plan that your customer subscribes to. Allows you to charge the customer on a recurring basis). See how this integration [compares to Stripe’s other integration types](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability).

The Payment Intents API is a lower-level API that you can use to build your own checkout or payments flow, but requires significantly more code and ongoing maintenance. We recommend the [Payment Element with Checkout Sessions](https://docs.stripe.com/payments/quickstart-checkout-sessions.md) for most integrations because it covers similar payment flows as Payment Intents. Learn more about [when to use Checkout Sessions instead of PaymentIntents](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison.md).

If you don’t want to build a custom payment form, you can integrate with the hosted version of Checkout. For an immersive version of that end-to-end integration guide, see the [Billing quickstart](https://docs.stripe.com/billing/quickstart.md).

If you aren’t ready to code an integration, you can set up basic subscriptions [manually in the Dashboard](https://docs.stripe.com/no-code/subscriptions.md). You can also use [Payment Links](https://docs.stripe.com/payment-links.md) to set up subscriptions without writing any code. Learn more about [designing an integration](https://docs.stripe.com/billing/subscriptions/design-an-integration.md) to understand the decisions you need to make and the resources you need.

## What you’ll build 

This guide shows you how to:

- Build a product catalog.
- Build a registration process that creates a customer.
- Create subscriptions and collect payment information.
- Test and monitor payment and subscription status.
- Let customers change their plan or cancel the subscription.
- Learn how to use [flexible billing mode](https://docs.stripe.com/billing/subscriptions/billing-mode.md) to access enhanced billing behavior and additional features.

## How to build on Stripe

[Subscriptions](https://docs.stripe.com/api/subscriptions.md) simplify your billing by automatically creating *Invoices* (Invoices are statements of amounts owed by a customer. They track the status of payments from draft through paid or otherwise finalized. Subscriptions automatically generate invoices, or you can manually create a one-off invoice) and [PaymentIntents](https://docs.stripe.com/api/payment_intents.md) for you. To create and activate a subscription, you need to first create a *Product* (Products represent what your business sells—whether that's a good or a service) to define what you’re selling, and a *Price* (Prices define how much and how often to charge for products. This includes how much the product costs, what currency to use, and the interval if the price is for subscriptions), which determines the amount to charge and how often. You also need either a customer-configured `Account` object or a `Customer` object to store the *PaymentMethods* (PaymentMethods represent your customer's payment instruments, used with the Payment Intents or Setup Intents APIs) used to make each recurring payment.

#### Accounts v2
A diagram illustrating common billing objects and their relationships (See full diagram at https://docs.stripe.com/payments/advanced/build-subscriptions)
#### Customer v1
A diagram illustrating common billing objects and their relationships (See full diagram at https://docs.stripe.com/payments/advanced/build-subscriptions)
### API object definitions

| Resource                                                                                                                             | Definition                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Account configured as a customer](https://docs.stripe.com/api/v2/core/accounts/create.md#v2_create_accounts-configuration-customer) | Represents a customer in the Accounts v2 API who purchases a subscription. Configure an `Account` object as a customer and associate it with a subscription to make and track recurring charges and to manage the products that they subscribe to. For more information, see the [Use Accounts as customers guide](https://docs.stripe.com/connect/use-accounts-as-customers.md).                             |
| [Customer](https://docs.stripe.com/api/customers.md)                                                                                 | Represents a customer in the Customers API who purchases a subscription. Use the `Customer` object associated with a subscription to make and track recurring charges and to manage the products that they subscribe to.                                                                                                                                                                                      |
| [Entitlement](https://docs.stripe.com/api/entitlements/active-entitlement.md)                                                        | Represents a customer’s access to a feature included in a service product that they subscribe to. When you create a subscription for a customer’s recurring purchase of a product, an active entitlement is automatically created for each feature associated with that product. When a customer accesses your services, use their active entitlements to enable the features included in their subscription. |
| [Feature](https://docs.stripe.com/api/entitlements/feature.md)                                                                       | Represents a function or ability that your customers can access when they subscribe to a service product. You can include features in a product by creating ProductFeatures.                                                                                                                                                                                                                                  |
| [Invoice](https://docs.stripe.com/api/invoices.md)                                                                                   | A statement of amounts a customer owes that tracks payment statuses from draft through paid or otherwise finalized. Subscriptions automatically generate invoices.                                                                                                                                                                                                                                            |
| [PaymentIntent](https://docs.stripe.com/api/payment_intents.md)                                                                      | A way to build dynamic payment flows. A PaymentIntent tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods. Invoices automatically create PaymentIntents.                                                                                                          |
| [PaymentMethod](https://docs.stripe.com/api/payment_methods.md)                                                                      | A customer’s payment methods that they use to pay for your products. For example, you can store a credit card on a customer-configured `Account` or `Customer` object and use it to make recurring payments for that customer. Typically used with the Payment Intents or Setup Intents APIs.                                                                                                                 |
| [Price](https://docs.stripe.com/api/prices.md)                                                                                       | Defines the unit price, currency, and billing cycle for a product.                                                                                                                                                                                                                                                                                                                                            |
| [Product](https://docs.stripe.com/api/products.md)                                                                                   | A good or service that your business sells. A service product can include one or more features.                                                                                                                                                                                                                                                                                                               |
| [ProductFeature](https://docs.stripe.com/api/product-feature.md)                                                                     | Represents a single feature’s inclusion in a single product. Each product is associated with a ProductFeature for each feature that it includes, and each feature is associated with a ProductFeature for each product that includes it.                                                                                                                                                                      |
| [Subscription](https://docs.stripe.com/api/subscriptions.md)                                                                         | Represents a customer’s scheduled recurring purchase of a product. Use a subscription to collect payments and provide repeated delivery of or continuous access to a product.                                                                                                                                                                                                                                 |

Here’s an example of how products, features, and entitlements work together. Imagine that you want to set up a recurring service that offers two tiers: a standard product with basic functionality, and an advanced product that adds extended functionality.

1. You create two features: `basic_features` and `extended_features`.
1. You create two products: `standard_product` and `advanced_product`.
1. For the standard product, you create one ProductFeature that associates `basic_features` with `standard_product`.
1. For the advanced product, you create two ProductFeatures: one that associates `basic_features` with `advanced_product` and one that associates `extended_features` with `advanced_product`.

A customer, `first_customer`, subscribes to the standard product. When you create the subscription, Stripe automatically creates an Entitlement that associates `first_customer` with `basic_features`.

Another customer, `second_customer`, subscribes to the advanced product. When you create the Subscription, Stripe automatically creates two Entitlements: one that associates `second_customer` with `basic_features`, and one that associates `second_customer` with `extended_features`.

You can determine which features to provision for a customer by [retrieving their active entitlements or listening to the Active Entitlement Summary event](https://docs.stripe.com/billing/entitlements.md#entitlements). You don’t have to retrieve their subscriptions, products, and features.

## Set up Stripe

Install the Stripe client of your choice:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

Next, install the Stripe CLI. The CLI provides webhook testing, and you can run it to make API calls to Stripe. This guide shows how to use the CLI to set up a pricing model in a later section.
For additional install options, see [Get started with the Stripe CLI](https://docs.stripe.com/stripe-cli.md).
## Create the pricing model [Stripe CLI or Dashboard]

[Recurring pricing models](https://docs.stripe.com/products-prices/pricing-models.md) represent the products or services you sell, how much they cost, what currency you accept for payments, and the service period for subscriptions. To build the pricing model, create [products](https://docs.stripe.com/api/products.md) (what you sell) and [prices](https://docs.stripe.com/api/prices.md) (how much and how often to charge for your products).

This example uses flat-rate pricing with two different service-level options: Basic and Premium. For each service-level option, you need to create a product and a recurring price. To add a one-time charge for something like a setup fee, create a third product with a one-time price.

Each product bills at monthly intervals. The price for the Basic product is 5 USD. The price for the Premium product is 15 USD. See the [flat rate pricing](https://docs.stripe.com/subscriptions/pricing-models/flat-rate-pricing.md) guide for an example with three tiers.

#### Dashboard

Go to the [Add a product](https://dashboard.stripe.com/test/products/create) page and create two products. Add one price for each product, each with a monthly recurring billing period:

- Premium product: Premium service with extra features

  - Price: Flat rate | 15 USD

- Basic product: Basic service with minimum features

  - Price: Flat rate | 5 USD

After you create the prices, record the price IDs so you can use them in other  steps. Price IDs look like this: `price_G0FvDp6vZvdwRZ`.

When you’re ready, use the **Copy to live mode** button at the top right of the page to clone your product from [a sandbox to live mode](https://docs.stripe.com/keys.md#test-live-modes).

#### API

You can use the API to create the [Products](https://docs.stripe.com/api/products.md) and [Prices](https://docs.stripe.com/api/prices.md).

Create the Premium product:

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "name=Billing Guide: Premium Service" \
  -d "description=Premium service with extra features"
```

Create the Basic product:

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "name=Billing Guide: Basic Service" \
  -d "description=Basic service with minimum features"
```

Record the product ID for each product. They look like this:

```json
{
  "id": "prod_H94k5odtwJXMtQ",
  "object": "product",
  "active": true,
  "attributes": [

  ],
  "created": 1587577341,
  "description": "Premium service with extra features",
  "images": [

  ],
  "livemode": false,
  "metadata": {
  },
  "name": "Billing Guide: Premium Service",
  "statement_descriptor": null,
  "type": "service",
  "unit_label": null,
  "updated": 1587577341
}
```

Use the product IDs to create a price for each product. The [unit_amount](https://docs.stripe.com/api/prices/object.md#price_object-unit_amount) number is in cents, so `1500` = 15 USD, for example.

Create the Premium price:

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d product={{PREMIUM_PRODUCT_ID}} \
  -d unit_amount=1500 \
  -d currency=eur \
  -d "recurring[interval]=month"
```

Create the Basic price:

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d product={{BASIC_PRODUCT_ID}} \
  -d unit_amount=500 \
  -d currency=eur \
  -d "recurring[interval]=month"
```

Record the price ID for each price so you can use them in subsequent steps. They look like this:

```json
{
  "id": "price_HGd7M3DV3IMXkC",
  "object": "price",
  "product": "prod_HGd6W1VUqqXGvr",
  "type": "recurring",
  "currency": "usd",
  "recurring": {
    "interval": "month",
    "interval_count": 1,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "active": true,
  "billing_scheme": "per_unit",
  "created": 1589319695,
  "livemode": false,
  "lookup_key": null,
  "metadata": {},
  "nickname": null,
  "unit_amount": 1500,
  "unit_amount_decimal": "1500",
  "tiers": null,
  "tiers_mode": null,
  "transform_quantity": null
}
```

## Create the customer [Client and Server]

Stripe needs a customer for each subscription. In your application front end, collect any necessary information from your users and pass it to the back end.

If you need to collect address details, the Address Element enables you to collect a shipping or billing address for your customers. For more information on the Address Element, see the [Address Element](https://docs.stripe.com/elements/address-element.md) page.

```html
<form id="signup-form">
  <label>
    Email
    <input id="email" type="email" placeholder="Email address" value="test@example.com" required />
  </label>

  <button type="submit">
    Register
  </button>
</form>
```

```javascript
const emailInput = document.querySelector('#email');

fetch('/create-customer', {
  method: 'post',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: emailInput.value,
  }),
}).then(r => r.json());
```

On the server, create an object to represent the customer. This can be either a customer-configured `Account` object or a `Customer` object. Save the object’s ID to use in the Checkout Session.

> #### Use the Accounts v2 API to represent customers
> 
> The Accounts v2 API is generally available for Connect users, and in public preview for other Stripe users. If you’re part of the Accounts v2 preview, you need to specify a [specify a preview version](https://docs.stripe.com/api-v2-overview.md#sdk-and-api-versioning) in your code.
> 
> To request access to the Accounts v2 preview, 
> 
> For most use cases, we recommend [modeling your customers as customer-configured Account objects](https://docs.stripe.com/connect/use-accounts-as-customers.md) instead of using [Customer](https://docs.stripe.com/api/customers.md) objects.

#### Accounts v2

```curl
curl -X POST https://api.stripe.com/v2/core/accounts \
  -H "Authorization: Bearer <<YOUR_SECRET_KEY>>" \
  -H "Stripe-Version: 2026-03-25.preview" \
  --json '{
    "contact_email": "jenny.rosen@example.com",
    "display_name": "Jenny Rosen",
    "identity": {
        "individual": {
            "given_name": "Jenny Rosen",
            "address": {
                "city": "San Francisco",
                "country": "US",
                "line1": "123 Main Street",
                "postal_code": "94605",
                "state": "CA"
            }
        }
    },
    "configuration": {
        "customer": {
            "capabilities": {
                "automatic_indirect_tax": {
                    "requested": true
                }
            },
            "shipping": {
                "address": {
                    "city": "San Francisco",
                    "country": "US",
                    "line1": "123 Main Street",
                    "postal_code": "94605",
                    "state": "CA"
                }
            }
        }
    },
    "include": [
        "configuration.customer",
        "identity"
    ]
  }'
```

#### Customers v1

```curl
curl https://api.stripe.com/v1/customers \
  -u "<<YOUR_SECRET_KEY>>:" \
  --data-urlencode "email=jenny.rosen@example.com" \
  -d "name=Jenny Rosen" \
  -d "shipping[address][city]=San Francisco" \
  -d "shipping[address][country]=US" \
  -d "shipping[address][line1]=123 Main Street" \
  -d "shipping[address][postal_code]=9460" \
  -d "shipping[address][state]=CA" \
  -d "shipping[name]=Jenny Rosen" \
  -d "address[city]=San Francisco" \
  -d "address[country]=US" \
  -d "address[line1]=123 Main Street" \
  -d "address[postal_code]=9460" \
  -d "address[state]=CA"
```

## Create the Subscription [Client and Server]

> If you want to render the Payment Element without first creating a subscription, see [Collect payment details before creating an Intent](https://docs.stripe.com/payments/accept-a-payment-deferred.md?type=subscription).

Allow your customer to choose a plan, and then create the subscription. In the example in this guide, the customer chooses between a Basic plan or Premium plan.

On the front end, pass the selected price ID and the customer record ID to the back end.

#### Accounts v2

```javascript
fetch('/create-subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: priceId,
    customerAccountId: customerAccountId,
  }),
})
```

#### Customers v1

```javascript
fetch('/create-subscription', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    priceId: priceId,
    customerId: customerId,
  }),
})
```

On the back end, create the subscription with an `incomplete` status using `payment_behavior=default_incomplete`. Then, return the `client_secret` from the subscription’s first [PaymentIntent](https://docs.stripe.com/payments/payment-intents.md) to the front end to complete payment. To do so, expand the [confirmation_secret](https://docs.stripe.com/api/invoices/object.md#invoice_object-confirmation_secret) on the latest invoice of the subscription.

To enable [improved subscription behavior](https://docs.stripe.com/billing/subscriptions/billing-mode.md), set `billing_mode[type]` to `flexible`. You must use the Stripe API version [2025-06-30.basil](https://docs.stripe.com/changelog/basil.md#2025-06-30.basil) or later.

Set [save_default_payment_method](https://docs.stripe.com/api/subscriptions/object.md#subscription_object-payment_settings-save_default_payment_method) to `on_subscription` to save the payment method as the default for a subscription when a payment succeeds. Saving a default payment method increases the success rate of future subscription payments.

The following example creates a `Subscription` and expands the `confirmation_secret` from its latest invoice in the response. That lets you pass the secret to the front end to confirm the payment.

#### Accounts v2

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "customer_account={{CUSTOMERACCOUNT_ID}}" \
  -d "items[0][price]={{PRICE_ID}}" \
  -d payment_behavior=default_incomplete \
  -d "payment_settings[save_default_payment_method]=on_subscription" \
  -d "billing_mode[type]=flexible" \
  -d "expand[0]=latest_invoice.confirmation_secret"
```

#### Customers v1

```curl
curl https://api.stripe.com/v1/subscriptions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "customer={{CUSTOMER_ID}}" \
  -d "items[0][price]={{PRICE_ID}}" \
  -d payment_behavior=default_incomplete \
  -d "payment_settings[save_default_payment_method]=on_subscription" \
  -d "billing_mode[type]=flexible" \
  -d "expand[0]=latest_invoice.confirmation_secret"
```

> If you’re using a *multi-currency price* (A single Price object can support multiple currencies. Each purchase uses one of the supported currencies for the Price, depending on how you use the Price in your integration), use the [currency](https://docs.stripe.com/api/subscriptions/create.md#create_subscription-currency) parameter to tell the subscription which of the supported currencies to use. If you omit the `currency` parameter, the subscription uses the default currency.

The Subscription is now `inactive` and awaiting payment. The example response below highlights the minimum fields to store, but you can store the fields that your application frequently accesses.

#### Accounts v2

```json
{"id": "sub_JgRjFjhKbtD2qz",
  "object": "subscription",
  "application_fee_percent": null,
  "automatic_tax": {
    "disabled_reason": null,
    "enabled": false,
    "liability": "null"
  },
  "billing_cycle_anchor": 1623873347,
  "billing_cycle_anchor_config": null,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1623873347,
  "currency": "usd","customer_account": identifier("customerAccount"),
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [

  ],
  "discounts": [],
  "ended_at": null,
  "invoice_customer_balance_settings": {
    "account_tax_ids": null,
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_JgRjmS4Ur1khEx",
        "object": "subscription_item",
        "created": 1623873347,"current_period_end": 1626465347,
        "current_period_start": 1623873347,
        "discounts": [],
        "metadata": {
        },
        "plan": {
          "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
          "object": "plan",
          "active": true,
          "amount": 2000,
          "amount_decimal": "2000",
          "billing_scheme": "per_unit",
          "created": 1623864151,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {
          },
          "nickname": null,
          "product": "prod_JgPF5xnq7qBun3",
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1623864151,
          "currency": "usd",
          "livemode": false,
          "lookup_key": null,
          "metadata": {
          },
          "nickname": null,
          "product": "prod_JgPF5xnq7qBun3",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 2000,
          "unit_amount_decimal": "2000"
        },
        "quantity": 1,
        "subscription": "sub_JgRjFjhKbtD2qz",
        "tax_rates": [

        ]
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_JgRjFjhKbtD2qz"
  },
  "latest_invoice": {
    "id": "in_1J34pzGPZ1iASj5zB87qdBNZ",
    "object": "invoice",
    "account_country": "US",
    "account_name": "Angelina's Store",
    "account_tax_ids": null,
    "amount_due": 2000,
    "amount_overpaid": 0,
    "amount_paid": 0,
    "amount_remaining": 2000,
    "amount_shipping": 0,
    "attempt_count": 0,
    "attempted": false,
    "auto_advance": false,
    "automatic_tax": {
      "disabled_reason": null,
      "enabled": false,
      "liability": null,
      "status": null
    },
    "automatically_finalizes_at": null,
    "billing_reason": "subscription_update",
    "collection_method": "charge_automatically",
    "created": 1623873347,
    "currency": "usd",
    "custom_fields": null,
    "customer_account": identifier("customerAccount"),
    "customer_address": null,
    "customer_email": "angelina@stripe.com",
    "customer_name": null,
    "customer_phone": null,
    "customer_shipping": {
      "address": {
        "city": "",
        "country": "US",
        "line1": "Berry",
        "line2": "",
        "postal_code": "",
        "state": ""
      },
      "name": "",
      "phone": null
    },
    "customer_tax_exempt": "none",
    "customer_tax_ids": [

    ],
    "default_payment_method": null,
    "default_source": null,
    "default_tax_rates": [

    ],
    "description": null,
    "discounts": [],
    "due_date": null,
    "effective_at": "1623873347",
    "ending_balance": 0,
    "footer": null,
    "from_invoice": null,
    "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1By64KGPZ1iASj5z/invst_JgRjzIOILGeq2MKC9T0KtyXnD5udsLp",
    "invoice_pdf": "https://pay.stripe.com/invoice/acct_1By64KGPZ1iASj5z/invst_JgRjzIOILGeq2MKC9T0KtyXnD5udsLp/pdf",
    "last_finalization_error": null,
    "latest_revision": null,
    "lines": {
      "object": "list",
      "data": [
        {
          "id": "il_1N2CjMBwKQ696a5NeOawRQP2",
          "object": "line_item",
          "amount": 2000,
          "currency": "usd",
          "description": "1 × Gold Special (at $20.00 / month)",
          "discount_amounts": [

          ],
          "discountable": true,
          "discounts": [

          ],
          "invoice": "in_1J34pzGPZ1iASj5zB87qdBNZ",
          "livemode": false,
          "metadata": {
          },
          "parent": {
            "invoice_item_details": null,
            "subscription_item_details":
            {
              "invoice_item": null,
            "proration": false,
            "proration_details":
            {
              "credited_items": null
            },
            "subscription":
            "sub_JgRjFjhKbtD2qz",
            "subscription_item":
              "si_JgRjmS4Ur1khEx"
            },
            "type": "subscription_item_details"
          },
          "period": {
            "end": 1626465347,
            "start": 1623873347
          },
          "plan": {
            "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
            "object": "plan",
            "active": true,
            "amount": 2000,
            "amount_decimal": "2000",
            "billing_scheme": "per_unit",
            "created": 1623864151,
            "currency": "usd",
            "interval": "month",
            "interval_count": 1,
            "livemode": false,
            "metadata": {
            },
            "nickname": null,
            "product": "prod_JgPF5xnq7qBun3",
            "tiers": null,
            "tiers_mode": null,
            "transform_usage": null,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "price": {
            "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
            "object": "price",
            "active": true,
            "billing_scheme": "per_unit",
            "created": 1623864151,
            "currency": "usd",
            "livemode": false,
            "lookup_key": null,
            "metadata": {
            },
            "nickname": null,
            "product": "prod_JgPF5xnq7qBun3",
            "recurring": {
              "interval": "month",
              "interval_count": 1,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "tiers_mode": null,
            "transform_quantity": null,
            "type": "recurring",
            "unit_amount": 2000,
            "unit_amount_decimal": "2000"
          },
          "quantity": 1,
          "taxes": []
        }
      ],
      "has_more": false,
      "total_count": 1,
      "url": "/v1/invoices/in_1J34pzGPZ1iASj5zB87qdBNZ/lines"
    },
    "livemode": false,
    "metadata": {
    },
    "next_payment_attempt": null,
    "number": "C008FC2-0354",
    "on_behalf_of": null,
    "parent": {
      "quote_details": null,
      "subscription_details": {
        "metadata": {},
        "pause_collection": null,
        "subscription": "sub_JgRjFjhKbtD2qz"
      }
    },
    "payment_intent": {
      "id": "pi_1J34pzGPZ1iASj5zI2nOAaE6",
      "object": "payment_intent",
      "allowed_source_types": [
        "card"
      ],
      "amount": 2000,
      "amount_capturable": 0,
      "amount_received": 0,
      "application": null,
      "application_fee_amount": null,
      "canceled_at": null,
      "cancellation_reason": null,
      "capture_method": "automatic",
      "charges": {
        "object": "list",
        "data": [

        ],
        "has_more": false,
        "total_count": 0,
        "url": "/v1/charges?payment_intent=pi_1J34pzGPZ1iASj5zI2nOAaE6"
      },
      "client_secret": "pi_1J34pzGPZ1iASj5zI2nOAaE6_secret_l7FN6ldFfXiFmJEumenJ2y2wu",
      "confirmation_method": "automatic",
      "created": 1623873347,
      "currency": "usd",
      "customer": "cus_CMqDWO2xODTZqt",
      "description": "Subscription creation",
      "invoice": "in_1J34pzGPZ1iASj5zB87qdBNZ",
      "last_payment_error": null,
      "livemode": false,
      "metadata": {
      },
      "next_action": null,
      "next_source_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "card": {
          "installments": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "receipt_email": null,
      "review": null,
      "setup_future_usage": "off_session",
      "shipping": null,
      "source": "card_1By6iQGPZ1iASj5z7ijKBnXJ",
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "requires_confirmation",
      "transfer_data": null,
      "transfer_group": null
    },
    "payment_settings": {
      "payment_method_options": null,
      "payment_method_types": null,
      "save_default_payment_method": "on_subscription"
    },
    "period_end": 1623873347,
    "period_start": 1623873347,
    "post_payment_credit_notes_amount": 0,
    "pre_payment_credit_notes_amount": 0,
    "receipt_number": null,
    "starting_balance": 0,
    "statement_descriptor": null,
    "status": "open",
    "status_transitions": {
      "finalized_at": 1623873347,
      "marked_uncollectible_at": null,
      "paid_at": null,
      "voided_at": null
    },
    "subscription": "sub_JgRjFjhKbtD2qz",
    "subtotal": 2000,
    "tax": null,
    "tax_percent": null,
    "total": 2000,
    "total_discount_amounts": [],
    "total_tax_amounts": [],
    "transfer_data": null,
    "webhooks_delivered_at": 1623873347
  },
  "livemode": false,
  "metadata": {
  },
  "next_pending_invoice_item_invoice": null,
  "pause_collection": null,
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "plan": {
    "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
    "object": "plan",
    "active": true,
    "amount": 2000,
    "amount_decimal": "2000",
    "billing_scheme": "per_unit",
    "created": 1623864151,
    "currency": "usd",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {
    },
    "nickname": null,
    "product": "prod_JgPF5xnq7qBun3",
    "tiers": null,
    "tiers_mode": null,
    "transform_usage": null,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "quantity": 1,
  "schedule": null,
  "start": 1623873347,
  "start_date": 1623873347,
  "status": "incomplete",
  "tax_percent": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_start": null
}
```

#### Customers v1

```json
{"id": "sub_JgRjFjhKbtD2qz",
  "object": "subscription",
  "application_fee_percent": null,
  "automatic_tax": {
    "disabled_reason": null,
    "enabled": false,
    "liability": "null"
  },
  "billing_cycle_anchor": 1623873347,
  "billing_cycle_anchor_config": null,
  "cancel_at": null,
  "cancel_at_period_end": false,
  "canceled_at": null,
  "cancellation_details": {
    "comment": null,
    "feedback": null,
    "reason": null
  },
  "collection_method": "charge_automatically",
  "created": 1623873347,
  "currency": "usd","customer": identifier("customer"),
  "days_until_due": null,
  "default_payment_method": null,
  "default_source": null,
  "default_tax_rates": [

  ],
  "discounts": [],
  "ended_at": null,
  "invoice_customer_balance_settings": {
    "account_tax_ids": null,
    "issuer": {
      "type": "self"
    }
  },
  "items": {
    "object": "list",
    "data": [
      {
        "id": "si_JgRjmS4Ur1khEx",
        "object": "subscription_item",
        "created": 1623873347,"current_period_end": 1626465347,
        "current_period_start": 1623873347,
        "discounts": [],
        "metadata": {
        },
        "plan": {
          "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
          "object": "plan",
          "active": true,
          "amount": 2000,
          "amount_decimal": "2000",
          "billing_scheme": "per_unit",
          "created": 1623864151,
          "currency": "usd",
          "interval": "month",
          "interval_count": 1,
          "livemode": false,
          "metadata": {
          },
          "nickname": null,
          "product": "prod_JgPF5xnq7qBun3",
          "tiers": null,
          "tiers_mode": null,
          "transform_usage": null,
          "trial_period_days": null,
          "usage_type": "licensed"
        },
        "price": {
          "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
          "object": "price",
          "active": true,
          "billing_scheme": "per_unit",
          "created": 1623864151,
          "currency": "usd",
          "livemode": false,
          "lookup_key": null,
          "metadata": {
          },
          "nickname": null,
          "product": "prod_JgPF5xnq7qBun3",
          "recurring": {
            "interval": "month",
            "interval_count": 1,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "tiers_mode": null,
          "transform_quantity": null,
          "type": "recurring",
          "unit_amount": 2000,
          "unit_amount_decimal": "2000"
        },
        "quantity": 1,
        "subscription": "sub_JgRjFjhKbtD2qz",
        "tax_rates": [

        ]
      }
    ],
    "has_more": false,
    "total_count": 1,
    "url": "/v1/subscription_items?subscription=sub_JgRjFjhKbtD2qz"
  },
  "latest_invoice": {
    "id": "in_1J34pzGPZ1iASj5zB87qdBNZ",
    "object": "invoice",
    "account_country": "US",
    "account_name": "Angelina's Store",
    "account_tax_ids": null,
    "amount_due": 2000,
    "amount_overpaid": 0,
    "amount_paid": 0,
    "amount_remaining": 2000,
    "amount_shipping": 0,
    "attempt_count": 0,
    "attempted": false,
    "auto_advance": false,
    "automatic_tax": {
      "disabled_reason": null,
      "enabled": false,
      "liability": null,
      "status": null
    },
    "automatically_finalizes_at": null,
    "billing_reason": "subscription_update",
    "collection_method": "charge_automatically",
    "created": 1623873347,
    "currency": "usd",
    "custom_fields": null,
    "customer": identifier("customer"),
    "customer_address": null,
    "customer_email": "angelina@stripe.com",
    "customer_name": null,
    "customer_phone": null,
    "customer_shipping": {
      "address": {
        "city": "",
        "country": "US",
        "line1": "Berry",
        "line2": "",
        "postal_code": "",
        "state": ""
      },
      "name": "",
      "phone": null
    },
    "customer_tax_exempt": "none",
    "customer_tax_ids": [

    ],
    "default_payment_method": null,
    "default_source": null,
    "default_tax_rates": [

    ],
    "description": null,
    "discounts": [],
    "due_date": null,
    "effective_at": "1623873347",
    "ending_balance": 0,
    "footer": null,
    "from_invoice": null,
    "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1By64KGPZ1iASj5z/invst_JgRjzIOILGeq2MKC9T0KtyXnD5udsLp",
    "invoice_pdf": "https://pay.stripe.com/invoice/acct_1By64KGPZ1iASj5z/invst_JgRjzIOILGeq2MKC9T0KtyXnD5udsLp/pdf",
    "last_finalization_error": null,
    "latest_revision": null,
    "lines": {
      "object": "list",
      "data": [
        {
          "id": "il_1N2CjMBwKQ696a5NeOawRQP2",
          "object": "line_item",
          "amount": 2000,
          "currency": "usd",
          "description": "1 × Gold Special (at $20.00 / month)",
          "discount_amounts": [

          ],
          "discountable": true,
          "discounts": [

          ],
          "invoice": "in_1J34pzGPZ1iASj5zB87qdBNZ",
          "livemode": false,
          "metadata": {
          },
          "parent": {
            "invoice_item_details": null,
            "subscription_item_details":
            {
              "invoice_item": null,
            "proration": false,
            "proration_details":
            {
              "credited_items": null
            },
            "subscription":
            "sub_JgRjFjhKbtD2qz",
            "subscription_item":
              "si_JgRjmS4Ur1khEx"
            },
            "type": "subscription_item_details"
          },
          "period": {
            "end": 1626465347,
            "start": 1623873347
          },
          "plan": {
            "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
            "object": "plan",
            "active": true,
            "amount": 2000,
            "amount_decimal": "2000",
            "billing_scheme": "per_unit",
            "created": 1623864151,
            "currency": "usd",
            "interval": "month",
            "interval_count": 1,
            "livemode": false,
            "metadata": {
            },
            "nickname": null,
            "product": "prod_JgPF5xnq7qBun3",
            "tiers": null,
            "tiers_mode": null,
            "transform_usage": null,
            "trial_period_days": null,
            "usage_type": "licensed"
          },
          "price": {
            "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
            "object": "price",
            "active": true,
            "billing_scheme": "per_unit",
            "created": 1623864151,
            "currency": "usd",
            "livemode": false,
            "lookup_key": null,
            "metadata": {
            },
            "nickname": null,
            "product": "prod_JgPF5xnq7qBun3",
            "recurring": {
              "interval": "month",
              "interval_count": 1,
              "trial_period_days": null,
              "usage_type": "licensed"
            },
            "tiers_mode": null,
            "transform_quantity": null,
            "type": "recurring",
            "unit_amount": 2000,
            "unit_amount_decimal": "2000"
          },
          "quantity": 1,
          "taxes": []
        }
      ],
      "has_more": false,
      "total_count": 1,
      "url": "/v1/invoices/in_1J34pzGPZ1iASj5zB87qdBNZ/lines"
    },
    "livemode": false,
    "metadata": {
    },
    "next_payment_attempt": null,
    "number": "C008FC2-0354",
    "on_behalf_of": null,
    "parent": {
      "quote_details": null,
      "subscription_details": {
        "metadata": {},
        "pause_collection": null,
        "subscription": "sub_JgRjFjhKbtD2qz"
      }
    },
    "payment_intent": {
      "id": "pi_1J34pzGPZ1iASj5zI2nOAaE6",
      "object": "payment_intent",
      "allowed_source_types": [
        "card"
      ],
      "amount": 2000,
      "amount_capturable": 0,
      "amount_received": 0,
      "application": null,
      "application_fee_amount": null,
      "canceled_at": null,
      "cancellation_reason": null,
      "capture_method": "automatic",
      "charges": {
        "object": "list",
        "data": [

        ],
        "has_more": false,
        "total_count": 0,
        "url": "/v1/charges?payment_intent=pi_1J34pzGPZ1iASj5zI2nOAaE6"
      },
      "client_secret": "pi_1J34pzGPZ1iASj5zI2nOAaE6_secret_l7FN6ldFfXiFmJEumenJ2y2wu",
      "confirmation_method": "automatic",
      "created": 1623873347,
      "currency": "usd",
      "customer": "cus_CMqDWO2xODTZqt",
      "description": "Subscription creation",
      "invoice": "in_1J34pzGPZ1iASj5zB87qdBNZ",
      "last_payment_error": null,
      "livemode": false,
      "metadata": {
      },
      "next_action": null,
      "next_source_action": null,
      "on_behalf_of": null,
      "payment_method": null,
      "payment_method_options": {
        "card": {
          "installments": null,
          "network": null,
          "request_three_d_secure": "automatic"
        }
      },
      "payment_method_types": [
        "card"
      ],
      "receipt_email": null,
      "review": null,
      "setup_future_usage": "off_session",
      "shipping": null,
      "source": "card_1By6iQGPZ1iASj5z7ijKBnXJ",
      "statement_descriptor": null,
      "statement_descriptor_suffix": null,
      "status": "requires_confirmation",
      "transfer_data": null,
      "transfer_group": null
    },
    "payment_settings": {
      "payment_method_options": null,
      "payment_method_types": null,
      "save_default_payment_method": "on_subscription"
    },
    "period_end": 1623873347,
    "period_start": 1623873347,
    "post_payment_credit_notes_amount": 0,
    "pre_payment_credit_notes_amount": 0,
    "receipt_number": null,
    "starting_balance": 0,
    "statement_descriptor": null,
    "status": "open",
    "status_transitions": {
      "finalized_at": 1623873347,
      "marked_uncollectible_at": null,
      "paid_at": null,
      "voided_at": null
    },
    "subscription": "sub_JgRjFjhKbtD2qz",
    "subtotal": 2000,
    "tax": null,
    "tax_percent": null,
    "total": 2000,
    "total_discount_amounts": [],
    "total_tax_amounts": [],
    "transfer_data": null,
    "webhooks_delivered_at": 1623873347
  },
  "livemode": false,
  "metadata": {
  },
  "next_pending_invoice_item_invoice": null,
  "pause_collection": null,
  "pending_invoice_item_interval": null,
  "pending_setup_intent": null,
  "pending_update": null,
  "plan": {
    "id": "price_1J32RfGPZ1iASj5zHHp57z7C",
    "object": "plan",
    "active": true,
    "amount": 2000,
    "amount_decimal": "2000",
    "billing_scheme": "per_unit",
    "created": 1623864151,
    "currency": "usd",
    "interval": "month",
    "interval_count": 1,
    "livemode": false,
    "metadata": {
    },
    "nickname": null,
    "product": "prod_JgPF5xnq7qBun3",
    "tiers": null,
    "tiers_mode": null,
    "transform_usage": null,
    "trial_period_days": null,
    "usage_type": "licensed"
  },
  "quantity": 1,
  "schedule": null,
  "start": 1623873347,
  "start_date": 1623873347,
  "status": "incomplete",
  "tax_percent": null,
  "transfer_data": null,
  "trial_end": null,
  "trial_start": null
}
```

## Collect payment information [Client]

Use [Stripe Elements](https://docs.stripe.com/payments/elements.md) to collect payment details and activate the subscription. You can customize Elements to match the look and feel of your application.

The [Payment Element](https://docs.stripe.com/payments/payment-element.md) supports [Link](https://docs.stripe.com/payments/link.md), credit cards, SEPA Direct Debit, and BECS Direct Debit for subscriptions. You can display the enabled payment methods and securely collect payment details based on your customer’s selection.

### Set up Stripe Elements

The Payment Element is automatically available as a feature of Stripe.js. Include the Stripe.js script on your payment page by adding it to the `head` of your HTML file. Always load Stripe.js directly from js.stripe.com to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
<body>
  <!-- content here -->
</body>
```

Create an instance of Stripe with the following JavaScript on your payment page:

```javascript
// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');
```

### Add the Payment Element to your page

The Payment Element needs a place to live on your payment page. Create an empty DOM node (container) with a unique ID in your payment form.

```html
<form id="payment-form">
  <div id="payment-element">
    <!-- Elements will create form elements here -->
  </div>
  <button id="submit">Subscribe</button>
  <div id="error-message">
    <!-- Display error message to your customers here -->
  </div>
</form>
```

After the form loads, create an instance of the Payment Element and mount it to the container DOM node. When you [created the subscription](https://docs.stripe.com/payments/advanced/build-subscriptions.md#create-subscription), you passed the `client_secret` value to the front end. Pass this value as an option when you create an instance of Elements.

```javascript
const options = {
  clientSecret: '{{CLIENT_SECRET}}',
  // Fully customizable with appearance API.
  appearance: {/*...*/},
};

// Set up Stripe.js and Elements to use in the payment form, passing the client secret obtained in step 5
const elements = stripe.elements(options);

const paymentElementOptions = {
  layout: "tabs",
};

// Create and mount the Payment Element
const paymentElement = elements.create('payment', paymentElementOptions);
paymentElement.mount('#payment-element');
```

The Payment Element renders a dynamic form that allows your customer to select a payment method. The form automatically collects all necessary payments details for the payment method that they select.

#### Optional Payment Element configurations

You can optionally do the following:

- Customize the Payment Element to match the design of your site by passing the [appearance object](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-appearance) into `options` when creating an instance of Elements.
- Configure the Apple Pay interface to return a [merchant token](https://docs.stripe.com/apple-pay/merchant-tokens.md?pay-element=web-pe) to support recurring, automatic reload, and deferred payments.

### Complete payment

Use `stripe.confirmPayment` to complete the payment using details from the Payment Element and activate the subscription. This creates a PaymentMethod, confirms the incomplete subscription’s first PaymentIntent, and makes a charge. If *Strong Customer Authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase) (SCA) is required for the payment, the Payment Element handles the authentication process before confirming the PaymentIntent.

Provide a [return_url](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-return_url) to indicate where Stripe redirects the user after they complete the payment. Your user might redirect to an intermediate site first, such as a bank authorization page, before redirecting to the `return_url`. Card payments immediately redirect to the `return_url` when a payment is successful.

```javascript
const form = document.getElementById('payment-form');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
const {error} = await stripe.confirmPayment({
    //`Elements` instance that was used to create the Payment Element
    elements,
    confirmParams: {
      return_url: "https://example.com/order/123/complete",
    }
  });

  if (error) {
    // This point is reached only if there's an immediate error when
    // confirming the payment. Show an error to your customer (for example, payment
    // details incomplete)
    const messageContainer = document.querySelector('#error-message');
    messageContainer.textContent = error.message;
  } else {
    // Your customer redirects to your `return_url`. For some payment
    // methods, such as iDEAL, your customer redirects to an intermediate
    // site first to authorize the payment, and then redirects to the `return_url`.
  }
});
```

When your customer submits a payment, Stripe redirects them to the `return_url` and includes the following URL query parameters. The return page can use them to get the status of the PaymentIntent so it can display the payment status to the customer.

When you specify the `return_url`, you can also append your own query parameters for use on the return page.

| Parameter                      | Description                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payment_intent`               | The unique identifier for the `PaymentIntent`.                                                                                                                                                                                                                                                                                                             |
| `payment_intent_client_secret` | The [client secret](https://docs.stripe.com/api/payment_intents/object.md#payment_intent_object-client_secret) of the `PaymentIntent` object. For subscription integrations, this client_secret is also exposed on the `Invoice` object through [`confirmation_secret`](https://docs.stripe.com/api/invoices/object.md#invoice_object-confirmation_secret) |

When the customer is redirected back to your site, you can use the `payment_intent_client_secret` to query for the PaymentIntent and display the transaction status to your customer.

> If you have tooling that tracks the customer’s browser session, you might need to add the `stripe.com` domain to the referrer exclude list. Redirects cause some tools to create new sessions, which prevents you from tracking the complete session.

Use one of the query parameters to retrieve the PaymentIntent. Inspect the [status of the PaymentIntent](https://docs.stripe.com/payments/paymentintents/lifecycle.md) to decide what to show your customers. You can also append your own query parameters when providing the `return_url`, which persist through the redirect process.

```javascript
// Initialize Stripe.js using your publishable key
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');

// Retrieve the "payment_intent_client_secret" query parameter appended to
// your return_url by Stripe.js
const clientSecret = new URLSearchParams(window.location.search).get(
  'payment_intent_client_secret'
);

// Retrieve the PaymentIntent
stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
  const message = document.querySelector('#message')

  // Inspect the PaymentIntent `status` to indicate the status of the payment
  // to your customer.
  //
  // Some payment methods [immediately succeed or fail][0] upon
  // confirmation, while others first enter a `processing` status.
  //
  // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
  switch (paymentIntent.status) {
    case 'succeeded':
      message.innerText = 'Success! Payment received.';
      break;

    case 'processing':
      message.innerText = "Payment processing. We'll update you when payment is received.";
      break;

    case 'requires_payment_method':
      message.innerText = 'Payment failed. Please try another payment method.';
      // Redirect your user back to your payment page to attempt collecting
      // payment again
      break;

    default:
      message.innerText = 'Something went wrong.';
      break;
  }
});
```

## Listen for webhooks [Server]

To complete the integration, you need to process *webhooks* (A webhook is a real-time push notification sent to your application as a JSON payload through HTTPS requests) sent by Stripe. These events trigger whenever the status in Stripe changes, such as subscriptions creating new invoices. In your application, set up an HTTP handler to accept a POST request containing the webhook event, and verify the signature of the event:

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/webhook' do
  # You can use webhooks to receive information about asynchronous payment events.
  # For more about our webhook events, see https://stripe.com/docs/webhooks.
  webhook_secret = ENV['STRIPE_WEBHOOK_SECRET']
  payload = request.body.read
  if !webhook_secret.empty?
    # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, webhook_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      status 400
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      puts '⚠️  Webhook signature verification failed.'
      status 400
      return
    end
  else
    data = JSON.parse(payload, symbolize_names: true)
    event = Stripe::Event.construct_from(data)
  end
  # Get the type of webhook event sent - used to check the status of PaymentIntents.
  event_type = event['type']
  data = event['data']
  data_object = data['object']

  if event_type == 'invoice.paid'
    # Used to provision services after the trial has ended.
    # The status of the invoice shows up as paid. Store the status in your
    # database to reference when a user accesses your service to avoid hitting rate
    # limits.
    # puts data_object
  end

  if event_type == 'invoice.payment_failed'
    # If the payment fails or the customer doesn't have a valid payment method,
    # an invoice.payment_failed event is sent and the subscription becomes past_due.
    # Use this webhook to notify your user that their payment has
    # failed and to retrieve new card details.
    # puts data_object
  end

  if event_type == 'customer.subscription.deleted'
    # handle subscription canceled automatically based
    # upon your subscription settings. Or if the user cancels it.
    # puts data_object
  end

  content_type 'application/json'
  { status: 'success' }.to_json
end
```

During development, use the Stripe CLI to [observe webhooks and forward them to your application](https://docs.stripe.com/webhooks.md#test-webhook). Run the following in a new terminal while your development app is running:

#### curl

```bash
  stripe listen --forward-to localhost:4242/webhook
```

For production, set up a webhook endpoint in [Workbench](https://docs.stripe.com/workbench.md), or use the [Webhook Endpoints API](https://docs.stripe.com/api/webhook_endpoints.md).

Listen to a few events to complete the remaining steps in this guide. See [Subscription events](https://docs.stripe.com/billing/subscriptions/webhooks.md#events) for more details about subscription-specific webhooks.

## Provision access to your service [Client and Server]

Now that the subscription is active, give your user access to your service. To do this, listen to the `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted` events. These events pass a `Subscription` object that contains a `status` field indicating whether the subscription is active, past due, or canceled. See [the subscription lifecycle](https://docs.stripe.com/billing/subscriptions/overview.md#subscription-lifecycle) for a complete list of statuses.

In your webhook handler:

1. Verify the subscription status. If it’s `active`, your user has paid for your product.
1. Check the product your customer subscribed to and grant access to your service. Checking the product instead of the price gives you more flexibility if you need to change the pricing or billing period.
1. Store the `product.id`, `subscription.id` and `subscription.status` in your database along with either the `customer_account.id` or the `customer.id` you already saved. Check this record when determining which features to enable for the user in your application.

The subscription status might change at any point during its lifetime, even if your application doesn’t directly make any calls to Stripe. For example, a renewal might fail because of an expired credit card, which puts the subscription into a `past due` status. Or, if you implement the [customer portal](https://docs.stripe.com/customer-management.md), a user might cancel their subscription without directly visiting your application. Implementing your handler correctly keeps your application status in sync with Stripe.

## Cancel the subscription [Client and Server]

You can allow customers to cancel their subscriptions. The example below adds a cancellation option to the account settings page.
![Sample subscription cancellation interface](https://b.stripecdn.com/docs-statics-srv/assets/fixed-price-subscriptions-guide-account-settings.6559626ba4b434826a67abfea165e097.png)

Account settings with the ability to cancel the subscription

```javascript
function cancelSubscription(subscriptionId) {
  return fetch('/cancel-subscription', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then(cancelSubscriptionResponse => {
      // Display to the user that the subscription has been canceled.
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/cancel-subscription' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  deleted_subscription = client.v1.subscriptions.cancel(data['subscriptionId'])

  deleted_subscription.to_json
end
```

Your application receives a `customer.subscription.deleted` event.

After the subscription is canceled, update your database to remove the Stripe subscription ID you previously stored, and limit access to your service.

When a subscription is canceled, it can’t be reactivated. Instead, collect updated billing information from your customer, update their default payment method, and create a new subscription with their existing customer record.

## Test your integration

### Test payment methods

Use the following table to test different payment methods and scenarios.

| Payment method    | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit | Your customer successfully pays with BECS Direct Debit.                                                                                                                                                                                                                                       | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status three minutes later. |
| BECS Direct Debit | Your customer’s payment fails with an `account_closed` error code.                                                                                                                                                                                                                            | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                    |
| Credit card       | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number `4242 4242 4242 4242` with any expiration, CVC, and postal code.                                                                                 |
| Credit card       | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number `4000 0025 0000 3155` with any expiration, CVC, and postal code.                                                                                 |
| Credit card       | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number `4000 0000 0000 9995` with any expiration, CVC, and postal code.                                                                                 |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                                                                                                                                                                                                                       | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later.           |
| SEPA Direct Debit | Your customer’s PaymentIntent status transitions from `processing` to `requires_payment_method`.                                                                                                                                                                                              | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                          |

### Monitor events

Set up webhooks to listen to subscription change events, such as upgrades and cancellations. Learn more about [subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks.md). You can view events in the [Dashboard](https://dashboard.stripe.com/test/events) or with the [Stripe CLI](https://docs.stripe.com/webhooks.md#test-webhook).

For more details, see [testing your Billing integration](https://docs.stripe.com/billing/testing.md).

## Optional: Let customers change their plans [Client and Server]

To let your customers change their subscription, collect the price ID of the option they want to change to. Then, send the new price ID from the front end to a back end endpoint. The example below also passes the subscription ID, but you can retrieve it from your database for your logged in user.

```javascript
function updateSubscription(priceId, subscriptionId) {
  return fetch('/update-subscription', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
      newPriceId: priceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then(response => {
      return response;
    });
}
```

On the back end, define the endpoint for your front end to call, passing the subscription ID and the new price ID. The subscription is now Premium at 15 USD per month, instead of Basic at 5 USD per month.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/update-subscription' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = client.v1.subscriptions.retrieve(data['subscriptionId'])

  updated_subscription =
    client.v1.subscriptions.update(
      data['subscriptionId'],
      cancel_at_period_end: false,
      items: [
        { id: subscription.items.data[0].id, price: data['newPriceId'] }
      ]
    )

  updated_subscription.to_json
end
```

Your application receives a `customer.subscription.updated` event.

## Optional: Preview a price change [Client and Server]

When your customer changes their subscription, there’s often an adjustment to the amount they owe, known as a [proration](https://docs.stripe.com/billing/subscriptions/prorations.md). You can use the [create preview invoice endpoint](https://docs.stripe.com/api/invoices/create_preview.md) to display the adjusted amount to your customers.

On the front end, pass the `create preview invoice` details to a back-end endpoint.

#### Accounts v2

```javascript
function createPreviewInvoice(
  customerAccountId,
  subscriptionId,
  newPriceId,
  trialEndDate
) {
  return fetch('/create-preview-invoice', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      customerAccountId: customerAccountId,
      subscriptionId: subscriptionId,
      newPriceId: newPriceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then((invoice) => {
      return invoice;
    });
}
```

#### Customers v1

```javascript
function createPreviewInvoice(
  customerId,
  subscriptionId,
  newPriceId,
  trialEndDate
) {
  return fetch('/create-preview-invoice', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customerId,
      subscriptionId: subscriptionId,
      newPriceId: newPriceId,
    }),
  })
    .then(response => {
      return response.json();
    })
    .then((invoice) => {
      return invoice;
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Accounts v2

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/create-preview-invoice' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = Stripe::Subscription.retrieve(data['subscriptionId'])

  invoice =
    Stripe::Invoice.create_preview(
      customer_account: data['customerAccountId'],
      subscription: data['subscriptionId'],
      subscription_details: {
        items: [
          { id: subscription.items.data[0].id, deleted: true },
          { price: data['newPriceId'], deleted: false }
        ]
      }
    )

  invoice.to_json
end
```

#### Customers v1

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/create-preview-invoice' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  subscription = client.v1.subscriptions.retrieve(data['subscriptionId'])

  invoice =
    client.v1.invoices.create_preview(
      customer: data['customerId'],
      subscription: data['subscriptionId'],
      subscription_details: {
        items: [
          { id: subscription.items.data[0].id, deleted: true },
          { price: data['newPriceId'], deleted: false }
        ]
      }
    )

  invoice.to_json
end
```

## Optional: Display the customer payment method [Client and Server]

Displaying the brand and last four digits of your customer’s card can help them know which card is being charged, or if they need to update their payment method.

On the front end, send the payment method ID to a back-end endpoint that retrieves the payment method details.

```javascript
function retrieveCustomerPaymentMethod(paymentMethodId) {
  return fetch('/retrieve-customer-payment-method', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId: paymentMethodId,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      return response;
    });
}
```

On the back end, define the endpoint for your front end to call.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

post '/retrieve-customer-payment-method' do
  content_type 'application/json'
  data = JSON.parse request.body.read

  payment_method = client.v1.payment_methods.retrieve(data['paymentMethodId'])

  payment_method.to_json
end
```

Example response:

```json
{
  "id": "pm_1GcbHY2eZvKYlo2CoqlVxo42",
  "object": "payment_method",
  "billing_details": {
    "address": {
      "city": null,
      "country": null,
      "line1": null,
      "line2": null,
      "postal_code": null,
      "state": null
    },
    "email": null,
    "name": null,
    "phone": null
  },
  "card": {
    "brand": "visa",
    "checks": {
      "address_line1_check": null,
      "address_postal_code_check": null,
      "cvc_check": "pass"
    },
    "country": "US",
    "exp_month": 8,
    "exp_year": 2021,
    "fingerprint": "Xt5EWLLDS7FJjR1c",
    "funding": "credit",
    "generated_from": null,
    "last4": "4242",
    "three_d_secure_usage": {
      "supported": true
    },
    "wallet": null
  },
  "created": 1588010536,
  "customer": "cus_HAxB7dVQxhoKLh",
  "livemode": false,
  "metadata": {},
  "type": "card"
}
```

> We recommend that you save the `paymentMethod.id` and `last4` in your database, for example, `paymentMethod.id` as `stripeCustomerPaymentMethodId` in your `users` collection or table. You can optionally store `exp_month`, `exp_year`, `fingerprint`, `billing_details` as needed. This limits the number of calls you make to Stripe, for performance efficiency and to avoid possible rate limiting.

## Disclose Stripe to your customers 

Stripe collects information on customer interactions with Elements to provide services to you, prevent fraud, and improve its services. This includes using cookies and IP addresses to identify which Elements a customer saw during a single checkout session. You’re responsible for disclosing and obtaining all rights and consents necessary for Stripe to use data in these ways. For more information, visit our [privacy center](https://stripe.com/legal/privacy-center#as-a-business-user-what-notice-do-i-provide-to-my-end-customers-about-stripe).

