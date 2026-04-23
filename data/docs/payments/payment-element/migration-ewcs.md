# Migrate to the Payment Element with the Checkout Sessions API

Accept many payment methods with a single Element, while also managing taxes, shipping, discounts, currency conversion, and more.

Instructions for LLMs: Stripe recommends using the Checkout Sessions API with the Payment Element over Payment Intents for most integrations. Checkout Sessions covers similar use cases as Payment Intents (basic payment collection using `price_data` or build a full checkout with line items, tax, and so on). Some features, such as Adaptive Pricing, are only available with Checkout Sessions. Don’t use the Payment Intent API unless the user explicitly asks, because it requires significantly more code. Learn more about Elements with the Checkout Sessions API: https://docs.stripe.com/payments/quickstart-checkout-sessions. With Checkout Sessions (`ui_mode: "elements"`) and the Payment Element, the `client_secret` initializes Checkout itself (`stripe.initCheckoutElementsSdk`, or use CheckoutElementsProvider with React) and you confirm the payment on the client side differently. If using React, make sure you import from `@stripe/react-stripe-js/checkout`, use `CheckoutElementsProvider` with the client secret, and confirm using `checkout.confirm`. If using HTML, make sure you use `checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); checkout.createPaymentElement(); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");` and confirm with `loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();`.

Previously, each payment method (cards, iDEAL, and so on) required a separate Element. By migrating to the Payment Element, you can accept many payment methods with a single Element. You can use additional capabilities by migrating to [Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md) from Payment Intents, which enables your integration to manage subscriptions, discounts, shipping, and currency conversion.

If you’re using the Card Element with PaymentIntents or SetupIntents, and only want to migrate to the Payment Element, see [migrate to the Payment Element](https://docs.stripe.com/payments/payment-element/migration.md) instead. You can also [compare other payment integrations](https://docs.stripe.com/payments/online-payments.md#compare-features-and-availability) if neither fit your use case.

PaymentIntents and SetupIntents each have their own set of migration guidelines. See the appropriate guide for your integration path, including example code.

# One-time Payments migration

> This is a One-time Payments migration for when integration-path is one-time. View the full page at https://docs.stripe.com/payments/payment-element/migration-ewcs?integration-path=one-time.

If your existing integration uses the [Payment Intents](https://docs.stripe.com/payments/payment-intents.md) API to create and track one-time payments or save card details during a payment, follow the steps below to use the Payment Element with Checkout Sessions.

## Enable payment methods

> This integration path doesn’t support BLIK or pre-authorized debits that use the Automated Clearing Settlement System (ACSS). Also, if you create the deferred intent from the client-side, you can’t use `customer_balance` with dynamic payment methods because the PaymentIntent requires a customer-configured [Account](https://docs.stripe.com/api/v2/core/accounts/object.md#v2_account_object-configuration-customer) or [Customer](https://docs.stripe.com/api/customers/object.md) object, which the client-side flow doesn’t support. To use `customer_balance`, create the `PaymentIntent` server-side with an `Account` or `Customer` and return its `client_secret` to the client.

View your [payment methods settings](https://dashboard.stripe.com/settings/payment_methods) and enable the payment methods you want to support. You need at least one payment method enabled to create a *Checkout Session* (A Checkout Session represents your customer's session as they pay for one-time purchases or subscriptions through Checkout. After a successful payment, the Checkout Session contains a reference to the Customer, and either the successful PaymentIntent or an active Subscription).

By default, Stripe enables cards and other common payment methods that can help you reach more customers, but we recommend turning on additional payment methods that are relevant for your business and customers. See [Payment method support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md) for product and payment method support, and our [pricing page](https://stripe.com/pricing/local-payment-methods) for fees.

## Migrate your PaymentIntent creation call [Server-side]

Upgrade your SDK to use the latest API version.

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

Because the Payment Element allows you to accept multiple payment methods, we recommend using [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md), which are automatically enabled if you don’t pass `payment_method_types` into the Checkout Session. When enabled, Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of payment methods available for your customers. We prioritize payment methods that increase conversion and are most relevant to the currency and location of the customer.

Update your PaymentIntent creation call to create a [Checkout Session](https://docs.stripe.com/api/checkout/sessions/create.md) instead. In the Checkout Sessions instance, you’ll pass:

- `line_items`: Represents what’s in the order

- `ui_mode: elements`: Indicates that you’re using Checkout elements

- `mode: payment`: Indicates that you’ll accept one-time payments for the Checkout Session

- `return_url`: Represents the URL to redirect your customer back to after they authenticate or cancel their payment on the payment method’s app or site.

In addition, return the Checkout Session’s [client_secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) to the client-side to use later.

Each Checkout Session generates a PaymentIntent upon confirmation. If you want to retain any extra parameters from your current integration while creating a PaymentIntent, refer to the options available in [payment_intent_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-payment_intent_data).

### Before

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

intent = client.v1.payment_intents.create({
  amount: 1099,
  currency: 'usd',
  payment_method_types: ['card'],
})

```

### After

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

session = client.v1.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {name: 'T-shirt'},
        unit_amount: 1099,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  ui_mode: 'elements',
  return_url: '{{RETURN_URL}}',
})

{
  clientSecret: session.client_secret,
}.to_json
```

## Optional: Additional Checkout Session options [Server-side]

[Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md) accept additional options that influence payment collection.

| Property                      | Type                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required                                   |
| ----------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `mode`                        | - `payment`
  - `setup`
  - `subscription` | Indicates whether the Payment Element is used with a *PaymentIntent* (The Payment Intents API tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods), *SetupIntent* (The Setup Intents API lets you build dynamic flows for collecting payment method details for future payments. It tracks the lifecycle of a payment setup flow and can trigger additional authentication steps if required by law or by the payment method), or *Subscription* (A Subscription represents the product details associated with the plan that your customer subscribes to. Allows you to charge the customer on a recurring basis). | Yes                                        |
| `line_items`                  | - `array of objects`                       | A list of items the customer is purchasing. See more of the [configurable parameters](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Yes, for `payment` and `subscription` mode |
| `automatic_tax`               | - `{enabled: boolean}`                     | Enabling this parameter causes Checkout to collect any billing address information necessary for tax calculation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No                                         |
| `allow_promotion_codes`       | - `boolean`                                | Enables user redeemable promotion codes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | No                                         |
| `billing_address_collection`  | - `auto`
  - `required`                    | Specify whether or not Checkout collects the customer’s billing address. Defaults to `auto`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No                                         |
| `payment_method_types`        | - `array of enums`                         | A list of the types of payment methods (for example, card) this Checkout Session can accept. This isn’t required if you use [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | No                                         |
| `phone_number_collection`     | - `{enabled: boolean}`                     | Controls phone number collection settings for the session. You can set in `payment` and `subscription` mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No                                         |
| `shipping_address_collection` | - `{allowed_countries: array of enums}`    | When set, provides configuration for Checkout to collect a shipping address from a customer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No                                         |
| `shipping_options`            | - `array of objects`                       | The shipping rate options to apply to this Session. Up to a maximum of 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No                                         |
| `customer_creation`           | - `always`
  - `if_required`               | Controls whether the Checkout Session will create a `Customer` if there isn’t one already passed into the Session. You can set this option in `payment` and `setup` mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No                                         |

## Migrate your Elements instance [Client-side]

#### HTML + JS

Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from `js.stripe.com` to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

Ensure you’re on the latest Stripe.js version by including the following script tag `<script src=“https://js.stripe.com/dahlia/stripe.js”></script>`. Learn more about [Stripe.js versioning and support policy](https://docs.stripe.com/sdks/stripejs-versioning.md).

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace your `stripe.elements()` call with [stripe.initCheckoutElementsSdk](https://docs.stripe.com/js/custom_checkout/init), passing in `clientSecret`. `initCheckoutElementsSdk` returns a `Checkout` instance.

The [Checkout](https://docs.stripe.com/js/custom_checkout) object acts as the foundation of your checkout page, because it contains data from the Checkout Session and methods to update the Session.

Use the object returned by [actions.getSession()](https://docs.stripe.com/js/custom_checkout/session) as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the session in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');
const elements = stripe.elements();
```

### After

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');

const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
  .then((response) => response.json())
  .then((json) => json.checkoutSessionClientSecret);
const checkout = stripe.initCheckoutElementsSdk({clientSecret});const loadActionsResult = await checkout.loadActions();
if (loadActionsResult.type === 'success') {
  const session = loadActionsResult.actions.getSession();
  const checkoutContainer = document.getElementById('checkout-container');
  checkoutContainer.append(JSON.stringify(session.lineItems, null, 2));
  checkoutContainer.append(document.createElement('br'));
  checkoutContainer.append(`Total: ${session.total.total.amount}`);
}
```

```html
<div id="checkout-container"></div>
```

#### React

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry. You need at least version 5.0.0 for React Stripe.js and version 8.0.0 for the Stripe.js loader.

```bash
npm install --save @stripe/react-stripe-js@^5.0.0 @stripe/stripe-js@^8.0.0
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace the `Elements` components with the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider) component, passing in `clientSecret` and the `stripe` instance.

Use the [useCheckout](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout) hook in your components to get the `Checkout` object, which contains data from the Checkout Session as well as methods to update the Session.

Use the `Checkout` object as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the `checkout` object in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```jsx
 const stripePromise =
     loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

 function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
```

### After

```jsx
import React from 'react';
import {CheckoutElementsProvider} from '@stripe/react-stripe-js/checkout';
import CheckoutForm from './CheckoutForm';

const App = () => {
  const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret);

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

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
  const {checkout} = checkoutState;
  return (
    <pre>{JSON.stringify(checkout.lineItems, null, 2)}
      {/* A formatted total amount */}
      Total: {checkout.total.total.amount}
    </pre>
  );
};
```

## Collect customer email [Client-side]

Migrating to Checkout elements requires the additional step of collecting your customer’s email.

#### HTML + JS

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/custom_checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [checkout.confirm](https://docs.stripe.com/js/custom_checkout/confirm).

```html
<input type="text" id="email" />
<div id="email-errors"></div>
```

```javascript
const checkout = stripe.initCheckoutElementsSdk({clientSecret});
const loadActionsResult = await checkout.loadActions();

if (loadActionsResult.type === 'success') {
  const {actions} = loadActionsResult;
  const emailInput = document.getElementById('email');
  const emailErrors = document.getElementById('email-errors');

  emailInput.addEventListener('input', () => {
    // Clear any validation errors
    emailErrors.textContent = '';
  });

  emailInput.addEventListener('blur', () => {
    const newEmail = emailInput.value;actions.updateEmail(newEmail).then((result) => {
      if (result.error) {
        emailErrors.textContent = result.error.message;
      }
    });
  });
}
```

#### React

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/react_stripe_js/checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [confirm](https://docs.stripe.com/js/react_stripe_js/checkout/confirm).

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const EmailInput = () => {
  const checkoutState = useCheckout();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState(null);

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }

  const handleBlur = () => {checkoutState.checkout.updateEmail(email).then((result) => {
      if (result.type === 'error') {
        setError(result.error);
      }
    })
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <div>
      <label htmlFor="checkout-form-email">Email</label>
      <input
        id="checkout-form-email"
        type="email"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default EmailInput;
```

## Add the Payment Element [Client-side]

You can now replace the Card Element and individual payment method Elements with the Payment Element. The Payment Element automatically adjusts to collect input fields based on the payment method and country (for example, full billing address collection for SEPA Direct Debit) so you don’t have to maintain customized input fields anymore.

The following example replaces `CardElement` with `PaymentElement`:

#### HTML + JS

```html
<form id="payment-form"><div id="payment-element">
    <!-- Mount the Payment Element here -->
  </div>
  <button id="submit">Submit</button>
</form>
```

```javascript
const paymentElement = checkout.createPaymentElement();
paymentElement.mount("#payment-element");
```

#### React

```jsx
 return (
   <form className="CheckoutForm"><PaymentElement />
    <button id="submit">Submit</button>
  </form>
);
```

## Update the submit handler [Client-side]

Instead of using individual confirm methods like `stripe.confirmCardPayment` or `stripe.confirmP24Payment`, use [actions.confirm](https://docs.stripe.com/js/custom_checkout/confirm) to collect payment information and submit it to Stripe.

To confirm the Checkout Session, update your submit handler to use `actions.confirm` instead of individual confirm methods.

When called, `actions.confirm` attempts to complete any [required actions](https://docs.stripe.com/payments/paymentintents/lifecycle.md), such as displaying a 3DS dialog or redirecting them to a bank authorization page. When confirmation is complete, customers redirect to the `return_url` you configured, which normally corresponds to a page on your website that provides the [status of the payment](https://docs.stripe.com/payments/accept-a-payment.md#web-post-payment).

If you want to keep the same checkout flow for card payments and only redirect for redirect-based payment methods, you can set [redirect](https://docs.stripe.com/js/custom_checkout/confirm#custom_checkout_session_confirm-options-redirect) to `if_required`.

The following code example replaces `stripe.confirmCardPayment` with `actions.confirm`:

### Before

```javascript


const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);


  if (error) {
    handleError(error);
  }
};
```

### After

```javascript
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);
const {error} = await actions.confirm();

  if (error) {
    handleError(error);
  }
};
```

## Optional: Save payment details during a payment

If your existing integration also saves payment details during a payment, use the [saved_payment_method_options.payment_method_save](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-saved_payment_method_options-payment_method_save) parameter when creating the Checkout Session instead of passing `setup_future_usage` at the confirm payment stage with `stripe.confirmCardPayment`.

Saving a payment method requires a Customer. Pass an existing Customer, or, to create a new Customer, set the Checkout Session’s [customer_creation](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-customer_creation) to `always`.

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

session = client.v1.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {name: 'T-shirt'},
        unit_amount: 1099,
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  ui_mode: 'elements',
  return_url: '{{RETURN_URL}}',customer_creation: 'always',
  saved_payment_method_options: {payment_method_save: 'enabled'},
})
```

You also need to pass a value for [savePaymentMethod](https://docs.stripe.com/js/custom_checkout/confirm#custom_checkout_session_confirm-options-savePaymentMethod) when confirming the Checkout Session to confirm whether the payment method is saved or not.

#### HTML + JS

```javascript
const {errors} = await actions.confirm({savePaymentMethod: true}
)
```

#### React

```jsx
const checkoutState = useCheckout();

const {errors} = await checkoutState.checkout.confirm({savePaymentMethod: true}
)
```

## Handle post-payment events [Server-side]

Stripe sends a [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed) event when the payment completes. Use the [Dashboard webhook tool](https://dashboard.stripe.com/webhooks) or follow the [webhook guide](https://docs.stripe.com/webhooks/quickstart.md) to receive these events and run actions, such as sending an order confirmation email to your customer, logging the sale in a database, or starting a shipping workflow.

Listen for these events rather than waiting on a callback from the client. On the client, the customer could close the browser window or quit the app before the callback executes, and malicious clients could manipulate the response. Setting up your integration to listen for asynchronous events is what enables you to accept [different types of payment methods](https://stripe.com/payments/payment-methods-guide) with a single integration.

In addition to handling the `checkout.session.completed` event, we recommend handling these other events when collecting payments with the Payment Element:

| Event                                                                                                                                        | Description                                                                      | Action                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [checkout.session.completed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.completed)                             | Sent when a customer successfully completes a payment.                           | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [checkout_session.async_payment_succeeded](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_succeeded) | Sent when payment by a customer using a delayed payment method finally succeeds. | Send the customer an order confirmation and *fulfill* (Fulfillment is the process of providing the goods or services purchased by a customer, typically after payment is collected) their order. |
| [checkout.session.async_payment_failed](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.async_payment_failed)       | Sent when a customer attempts a payment, but the payment fails.                  | If a payment transitions from `async_payment_failed`, offer the customer another attempt to pay.                                                                                                 |
| [checkout.session.expired](https://docs.stripe.com/api/events/types.md#event_types-checkout.session.expired)                                 | Sent when a customer’s checkout session has expired, which is after 24 hours.    | If a payment transitions from `expired` to `payment_failed`, offer the customer an attempt to reload the checkout page and create a new checkout session.                                        |

## Test the integration

1. Navigate to your checkout page.
1. Fill out the payment details with a payment method from the following table. For card payments:
   - Enter any future date for card expiry.
   - Enter any 3-digit number for CVC.
   - Enter any billing postal code.
1. Submit the payment to Stripe.
1. Go to the Dashboard and look for the payment on the [Transactions page](https://dashboard.stripe.com/test/payments?status%5B0%5D=successful). If your payment succeeded, you’ll see it in that list.
1. Click your payment to see more details, like billing information and the list of purchased items. You can use this information to [fulfill the order](https://docs.stripe.com/checkout/fulfillment.md).

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## See also

- [Collect Billing and shipping addresses](https://docs.stripe.com/payments/collect-addresses.md?payment-ui=embedded-components)
- [Use promotion codes for one-time payments](https://docs.stripe.com/payments/checkout/discounts.md?payment-ui=embedded-components)
- [Collect tax automatically](https://docs.stripe.com/payments/checkout/taxes.md?payment-ui=embedded-components)
- [Enable adjustable line item quantity](https://docs.stripe.com/payments/checkout/adjustable-quantity.md?payment-ui=embedded-components)
- [Automatic currency conversion](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components)


# SetupIntent migration

> This is a SetupIntent migration for when integration-path is future. View the full page at https://docs.stripe.com/payments/payment-element/migration-ewcs?integration-path=future.

If your existing integration uses the [Setup Intents](https://docs.stripe.com/payments/setup-intents.md) API for future payments, follow the steps below to use the Payment Element with Checkout Sessions.

## Enable payment methods

> This integration path doesn’t support BLIK or pre-authorized debits that use the Automated Clearing Settlement System (ACSS). Also, if you create the deferred intent from the client-side, you can’t use `customer_balance` with dynamic payment methods because the PaymentIntent requires a customer-configured [Account](https://docs.stripe.com/api/v2/core/accounts/object.md#v2_account_object-configuration-customer) or [Customer](https://docs.stripe.com/api/customers/object.md) object, which the client-side flow doesn’t support. To use `customer_balance`, create the `PaymentIntent` server-side with an `Account` or `Customer` and return its `client_secret` to the client.

View your [payment methods settings](https://dashboard.stripe.com/settings/payment_methods) and enable the payment methods you want to support. You need at least one payment method enabled to create a *Checkout Session* (A Checkout Session represents your customer's session as they pay for one-time purchases or subscriptions through Checkout. After a successful payment, the Checkout Session contains a reference to the Customer, and either the successful PaymentIntent or an active Subscription).

By default, Stripe enables cards and other common payment methods that can help you reach more customers, but we recommend turning on additional payment methods that are relevant for your business and customers. See [Payment method support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md) for product and payment method support, and our [pricing page](https://stripe.com/pricing/local-payment-methods) for fees.

## Migrate your SetupIntent creation call [Server-side]

Upgrade your SDK to use the latest API version.

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

Because the Payment Element allows you to accept multiple payment methods, we recommend using [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md), which are automatically enabled if you don’t pass `payment_method_types` into the Checkout Session. When enabled, Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of payment methods available for your customers. We prioritize payment methods that increase conversion and are most relevant to the currency and location of the customer.

Update your SetupIntent creation call to create a [Checkout Session](https://docs.stripe.com/api/checkout/sessions/create.md) instead. With Checkout Sessions, you’ll pass:

- `ui_mode: elements`: Indicates that you’re using Checkout elements
- `mode: setup`: Indicates that you’re using the customer’s payment details to charge them later
- `return_url`: The URL to redirect your customer back to after they authenticate or cancel their payment on the payment method’s app or site
- `currency`: Required when `payment_method_types` isn’t set

In addition, return the Checkout Session’s [client_secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) to the client-side to use later.

Each Checkout Session generates a SetupIntent upon confirmation. If you want to retain any extra parameters from your current integration while creating a SetupIntent, refer to the options available in [setup_intent_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-setup_intent_data).

### Before

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

intent = client.v1.setup_intents.create()

```

### After

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

session = client.v1.checkout.sessions.create({
  mode: 'setup',
  ui_mode: 'elements',
  return_url: '{{RETURN_URL}}',
  currency: 'usd',
})

{
  clientSecret: session.client_secret,
}.to_json
```

## Optional: Additional Checkout Session options [Server-side]

[Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md) accept additional options that influence payment collection.

| Property                      | Type                                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required |
| ----------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `mode`                        | - `payment`
  - `setup`
  - `subscription`               | Indicates whether the Payment Element is used with a *PaymentIntent* (The Payment Intents API tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods), *SetupIntent* (The Setup Intents API lets you build dynamic flows for collecting payment method details for future payments. It tracks the lifecycle of a payment setup flow and can trigger additional authentication steps if required by law or by the payment method), or *Subscription* (A Subscription represents the product details associated with the plan that your customer subscribes to. Allows you to charge the customer on a recurring basis). | Yes      |
| `billing_address_collection`  | - `auto`
  - `required`                                  | Specify whether or not Checkout collects the customer’s billing address. Defaults to `auto`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No       |
| `payment_method_types`        | - `array of enums`                                       | A list of the types of payment methods (for example, card) this Checkout Session can accept. You don’t need to set this parameter if you’re already using [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No       |
| `shipping_address_collection` | - `{allowed_countries: array of enums}`                  | When set, provides configuration for Checkout to collect a shipping address from a customer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No       |
| `shipping_rate_options`       | - `{shipping_rate: string; shipping_rate_data: object;}` | The shipping rate options to apply to this Session. Up to a maximum of 5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | No       |

## Migrate your Elements instance [Client-side]

#### HTML + JS

Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from `js.stripe.com` to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

Ensure you’re on the latest Stripe.js version by including the following script tag `<script src=“https://js.stripe.com/dahlia/stripe.js”></script>`. Learn more about [Stripe.js versioning and support policy](https://docs.stripe.com/sdks/stripejs-versioning.md).

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace your `stripe.elements()` call with [stripe.initCheckoutElementsSdk](https://docs.stripe.com/js/custom_checkout/init), passing in `clientSecret`. `initCheckoutElementsSdk` returns a `Checkout` instance.

The [Checkout](https://docs.stripe.com/js/custom_checkout) object acts as the foundation of your checkout page, because it contains data from the Checkout Session and methods to update the Session.

Use the object returned by [actions.getSession()](https://docs.stripe.com/js/custom_checkout/session) as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the session in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');
const elements = stripe.elements();
```

### After

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');

const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
  .then((response) => response.json())
  .then((json) => json.checkoutSessionClientSecret);
const checkout = stripe.initCheckoutElementsSdk({clientSecret});const loadActionsResult = await checkout.loadActions();
if (loadActionsResult.type === 'success') {
  const session = loadActionsResult.actions.getSession();
  const checkoutContainer = document.getElementById('checkout-container');
  checkoutContainer.append(JSON.stringify(session.lineItems, null, 2));
  checkoutContainer.append(document.createElement('br'));
  checkoutContainer.append(`Total: ${session.total.total.amount}`);
}
```

```html
<div id="checkout-container"></div>
```

#### React

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry. You need at least version 5.0.0 for React Stripe.js and version 8.0.0 for the Stripe.js loader.

```bash
npm install --save @stripe/react-stripe-js@^5.0.0 @stripe/stripe-js@^8.0.0
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace the `Elements` components with the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider) component, passing in `clientSecret` and the `stripe` instance.

Use the [useCheckout](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout) hook in your components to get the `Checkout` object, which contains data from the Checkout Session as well as methods to update the Session.

Use the `Checkout` object as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the `checkout` object in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```jsx
 const stripePromise =
     loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

 function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
```

### After

```jsx
import React from 'react';
import {CheckoutElementsProvider} from '@stripe/react-stripe-js/checkout';
import CheckoutForm from './CheckoutForm';

const App = () => {
  const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret);

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

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
  const {checkout} = checkoutState;
  return (
    <pre>{JSON.stringify(checkout.lineItems, null, 2)}
      {/* A formatted total amount */}
      Total: {checkout.total.total.amount}
    </pre>
  );
};
```

## Collect customer email [Client-side]

Migrating to Checkout elements requires the additional step of collecting your customer’s email.

#### HTML + JS

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/custom_checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [checkout.confirm](https://docs.stripe.com/js/custom_checkout/confirm).

```html
<input type="text" id="email" />
<div id="email-errors"></div>
```

```javascript
const checkout = stripe.initCheckoutElementsSdk({clientSecret});
const loadActionsResult = await checkout.loadActions();

if (loadActionsResult.type === 'success') {
  const {actions} = loadActionsResult;
  const emailInput = document.getElementById('email');
  const emailErrors = document.getElementById('email-errors');

  emailInput.addEventListener('input', () => {
    // Clear any validation errors
    emailErrors.textContent = '';
  });

  emailInput.addEventListener('blur', () => {
    const newEmail = emailInput.value;actions.updateEmail(newEmail).then((result) => {
      if (result.error) {
        emailErrors.textContent = result.error.message;
      }
    });
  });
}
```

#### React

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/react_stripe_js/checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [confirm](https://docs.stripe.com/js/react_stripe_js/checkout/confirm).

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const EmailInput = () => {
  const checkoutState = useCheckout();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState(null);

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }

  const handleBlur = () => {checkoutState.checkout.updateEmail(email).then((result) => {
      if (result.type === 'error') {
        setError(result.error);
      }
    })
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <div>
      <label htmlFor="checkout-form-email">Email</label>
      <input
        id="checkout-form-email"
        type="email"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default EmailInput;
```

## Add the Payment Element [Client-side]

You can now replace the Card Element and individual payment method Elements with the Payment Element. The Payment Element automatically adjusts to collect input fields based on the payment method and country (for example, full billing address collection for SEPA Direct Debit) so you don’t have to maintain customized input fields anymore.

The following example replaces `CardElement` with `PaymentElement`:

#### HTML + JS

```html
<form id="payment-form"><div id="payment-element">
    <!-- Mount the Payment Element here -->
  </div>
  <button id="submit">Submit</button>
</form>
```

```javascript
const paymentElement = checkout.createPaymentElement();
paymentElement.mount("#payment-element");
```

#### React

```jsx
 return (
   <form className="CheckoutForm"><PaymentElement />
    <button id="submit">Submit</button>
  </form>
);
```

## Update the submit handler [Client-side]

Instead of using individual confirm methods such as `stripe.confirmCardSetup` or `stripe.confirmP24Setup`, use [actions.confirm](https://docs.stripe.com/js/custom_checkout/confirm) to collect payment information and submit it to Stripe.

To confirm the Checkout Session, update your submit handler to use `actions.confirm` instead of individual confirm methods.

When called, `actions.confirm` attempts to complete any [required actions](https://docs.stripe.com/payments/paymentintents/lifecycle.md), such as authenticating your customers by displaying a 3DS dialog or redirecting them to a bank authorization page. When confirmation is complete, customers redirect to the `return_url` you configured, which normally corresponds to a page on your website that [provides the status of the payment](https://docs.stripe.com/payments/accept-a-payment.md#web-post-payment).

If you want to keep the same checkout flow for card payments and only redirect for redirect-based payment methods, you can set [redirect](https://docs.stripe.com/js/custom_checkout/confirm#custom_checkout_session_confirm-options-redirect) to `if_required`.

The following code examples replaces `stripe.confirmCardSetup` with `actions.confirm`:

### Before

```javascript


const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);


  if (error) {
    handleError(error);
  }
};
```

### After

```javascript
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);
// Use the clientSecret and Elements instance to confirm the setup
  const {error} = await actions.confirm();

  if (error) {
    handleError(error);
  }
};
```

## Test the integration

1. Navigate to your checkout page.
1. Fill out the payment details with a payment method from the following table. For card payments:
   - Enter any future date for card expiry.
   - Enter any 3-digit number for CVC.
   - Enter any billing postal code.
1. Submit the payment to Stripe.
1. Go to the Dashboard and look for the payment on the [Transactions page](https://dashboard.stripe.com/test/payments?status%5B0%5D=successful). If your payment succeeded, you’ll see it in that list.
1. Click your payment to see more details, like billing information and the list of purchased items. You can use this information to [fulfill the order](https://docs.stripe.com/checkout/fulfillment.md).

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## See also

- [Collect Billing and shipping addresses](https://docs.stripe.com/payments/collect-addresses.md?payment-ui=embedded-components)
- [Use promotion codes for one-time payments](https://docs.stripe.com/payments/checkout/discounts.md?payment-ui=embedded-components)
- [Collect tax automatically](https://docs.stripe.com/payments/checkout/taxes.md?payment-ui=embedded-components)
- [Enable adjustable line item quantity](https://docs.stripe.com/payments/checkout/adjustable-quantity.md?payment-ui=embedded-components)
- [Automatic currency conversion](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md?payment-ui=embedded-components)


# Subscription migration

> This is a Subscription migration for when integration-path is subscription. View the full page at https://docs.stripe.com/payments/payment-element/migration-ewcs?integration-path=subscription.

If your existing integration uses the [Subscriptions](https://docs.stripe.com/billing/subscriptions/overview.md) API to allow customers to make recurring payments, follow the steps below to use the Payment Element with Checkout Sessions.

## Enable payment methods

> This integration path doesn’t support BLIK or pre-authorized debits that use the Automated Clearing Settlement System (ACSS). Also, if you create the deferred intent from the client-side, you can’t use `customer_balance` with dynamic payment methods because the PaymentIntent requires a customer-configured [Account](https://docs.stripe.com/api/v2/core/accounts/object.md#v2_account_object-configuration-customer) or [Customer](https://docs.stripe.com/api/customers/object.md) object, which the client-side flow doesn’t support. To use `customer_balance`, create the `PaymentIntent` server-side with an `Account` or `Customer` and return its `client_secret` to the client.

View your [payment methods settings](https://dashboard.stripe.com/settings/payment_methods) and enable the payment methods you want to support. You need at least one payment method enabled to create a *Checkout Session* (A Checkout Session represents your customer's session as they pay for one-time purchases or subscriptions through Checkout. After a successful payment, the Checkout Session contains a reference to the Customer, and either the successful PaymentIntent or an active Subscription).

By default, Stripe enables cards and other common payment methods that can help you reach more customers, but we recommend turning on additional payment methods that are relevant for your business and customers. See [Payment method support](https://docs.stripe.com/payments/payment-methods/payment-method-support.md) for product and payment method support, and our [pricing page](https://stripe.com/pricing/local-payment-methods) for fees.

## Migrate your Subscription creation call [Server-side]

Upgrade your SDK to use the latest API version.

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

Because the Payment Element allows you to accept multiple payment methods, we recommend using [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md). Dynamic payment methods are automatically enabled if you don’t pass `payment_method_types` into the Checkout Session. When enabled, Stripe evaluates the currency, payment method restrictions, and other parameters to determine the list of payment methods available for your customers. We prioritize payment methods that increase conversion and are most relevant to the currency and location of the customer.

Update your Subscription creation call to create a [Checkout Session](https://docs.stripe.com/api/checkout/sessions/create.md) instead. In the Checkout Sessions instance, pass:

- `line_items`: Represents what’s in the order.

- `ui_mode: elements`: Indicates that you’re using Checkout elements.

- `mode: subscription`: Indicates that your customer will make recurring payments for the Checkout Session.

- `return_url`: The URL to redirect your customer back to after they authenticate or cancel their payment on the payment method’s app or site.

In addition, return the Checkout Session’s [client_secret](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-client_secret) to the client side to use later.

Each Checkout Session generates a PaymentIntent upon confirmation. If you want to retain any extra parameters from your current integration while creating a PaymentIntent, refer to the options available in [payment_intent_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-payment_intent_data).

Creating a Checkout Session in `mode: subscription` automatically creates a Customer object on payment confirmation, so you don’t need to manually create a Customer object.

### Before

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

customer = client.v1.customers.create({
  name: 'Jenny Rosen',
  email: 'jennyrosen@example.com',
})

subscription = client.v1.subscriptions.create({
  customer: 'cus_Na6dX7aXxi11N4',
  items: [{price: 'price_1MowQULkdIwHu7ixraBm864M'}],
})

```

### After

#### Ruby

```ruby
require 'stripe'
# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

session = client.v1.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        product_data: {name: 'T-shirt'},
        unit_amount: 1099,
      },
      quantity: 1,
    },
  ],
  mode: 'subscription',
  ui_mode: 'elements',
  return_url: '{{RETURN_URL}}',
})

{
  clientSecret: session.client_secret,
}.to_json
```

## Optional: Additional Checkout Session options [Server-side]

[Checkout Sessions](https://docs.stripe.com/api/checkout/sessions.md) accept additional options that influence payment collection.

| Property                     | Type                                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required                                   |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `mode`                       | - `payment`
  - `setup`
  - `subscription` | Indicates whether the Payment Element is used with a *PaymentIntent* (The Payment Intents API tracks the lifecycle of a customer checkout flow and triggers additional authentication steps when required by regulatory mandates, custom Radar fraud rules, or redirect-based payment methods), *SetupIntent* (The Setup Intents API lets you build dynamic flows for collecting payment method details for future payments. It tracks the lifecycle of a payment setup flow and can trigger additional authentication steps if required by law or by the payment method), or *Subscription* (A Subscription represents the product details associated with the plan that your customer subscribes to. Allows you to charge the customer on a recurring basis). | Yes                                        |
| `line_items`                 | - `array of objects`                       | A list of items the customer is purchasing. See more of the [configurable parameters](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Yes, for `payment` and `subscription` mode |
| `automatic_tax`              | - `{enabled: boolean}`                     | Enabling this parameter causes Checkout to collect any billing address information necessary for tax calculation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No                                         |
| `allow_promotion_codes`      | - `boolean`                                | Enables user redeemable promotion codes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | No                                         |
| `billing_address_collection` | - `auto`
  - `required`                    | Specify whether or not Checkout collects the customer’s billing address. Defaults to `auto`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | No                                         |
| `payment_method_types`       | - `array of enums`                         | A list of the types of payment methods (for example, card) this Checkout Session can accept. This isn’t required if you use [dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | No                                         |
| `phone_number_collection`    | - `{enabled: boolean}`                     | Controls phone number collection settings for the session. You can set this in `payment` and `subscription` mode.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | No                                         |

## Migrate your Elements instance [Client-side]

#### HTML + JS

Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from `js.stripe.com` to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

Ensure you’re on the latest Stripe.js version by including the following script tag `<script src=“https://js.stripe.com/dahlia/stripe.js”></script>`. Learn more about [Stripe.js versioning and support policy](https://docs.stripe.com/sdks/stripejs-versioning.md).

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace your `stripe.elements()` call with [stripe.initCheckoutElementsSdk](https://docs.stripe.com/js/custom_checkout/init), passing in `clientSecret`. `initCheckoutElementsSdk` returns a `Checkout` instance.

The [Checkout](https://docs.stripe.com/js/custom_checkout) object acts as the foundation of your checkout page, because it contains data from the Checkout Session and methods to update the Session.

Use the object returned by [actions.getSession()](https://docs.stripe.com/js/custom_checkout/session) as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the session in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');
const elements = stripe.elements();
```

### After

```javascript
const stripe =
    Stripe('<<YOUR_PUBLISHABLE_KEY>>');

const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
  .then((response) => response.json())
  .then((json) => json.checkoutSessionClientSecret);
const checkout = stripe.initCheckoutElementsSdk({clientSecret});const loadActionsResult = await checkout.loadActions();
if (loadActionsResult.type === 'success') {
  const session = loadActionsResult.actions.getSession();
  const checkoutContainer = document.getElementById('checkout-container');
  checkoutContainer.append(JSON.stringify(session.lineItems, null, 2));
  checkoutContainer.append(document.createElement('br'));
  checkoutContainer.append(`Total: ${session.total.total.amount}`);
}
```

```html
<div id="checkout-container"></div>
```

#### React

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry. You need at least version 5.0.0 for React Stripe.js and version 8.0.0 for the Stripe.js loader.

```bash
npm install --save @stripe/react-stripe-js@^5.0.0 @stripe/stripe-js@^8.0.0
```

Create `clientSecret` as a `Promise<string> | string` that contains the client secret returned by your server.

Replace the `Elements` components with the [CheckoutElementsProvider](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider) component, passing in `clientSecret` and the `stripe` instance.

Use the [useCheckout](https://docs.stripe.com/js/react_stripe_js/checkout/use_checkout) hook in your components to get the `Checkout` object, which contains data from the Checkout Session as well as methods to update the Session.

Use the `Checkout` object as your reference for prices. We recommend reading and displaying the `total` and `lineItems` from the `checkout` object in your UI.

This lets you turn on new features with minimal code changes. For example, adding [manual currency prices](https://docs.stripe.com/payments/custom/localize-prices/manual-currency-prices.md) requires no UI changes if you display the `total`.

### Before

```jsx
 const stripePromise =
     loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

 function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};
```

### After

```jsx
import React from 'react';
import {CheckoutElementsProvider} from '@stripe/react-stripe-js/checkout';
import CheckoutForm from './CheckoutForm';

const App = () => {
  const clientSecret = fetch('/create-checkout-session', {method: 'POST'})
    .then((response) => response.json())
    .then((json) => json.checkoutSessionClientSecret);

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

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const CheckoutForm = () => {const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
  const {checkout} = checkoutState;
  return (
    <pre>{JSON.stringify(checkout.lineItems, null, 2)}
      {/* A formatted total amount */}
      Total: {checkout.total.total.amount}
    </pre>
  );
};
```

## Collect customer email [Client-side]

When you migrate to Checkout elements, you must take the additional step of collecting your customer’s email.

#### HTML + JS

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/custom_checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [checkout.confirm](https://docs.stripe.com/js/custom_checkout/confirm).

```html
<input type="text" id="email" />
<div id="email-errors"></div>
```

```javascript
const checkout = stripe.initCheckoutElementsSdk({clientSecret});
const loadActionsResult = await checkout.loadActions();

if (loadActionsResult.type === 'success') {
  const {actions} = loadActionsResult;
  const emailInput = document.getElementById('email');
  const emailErrors = document.getElementById('email-errors');

  emailInput.addEventListener('input', () => {
    // Clear any validation errors
    emailErrors.textContent = '';
  });

  emailInput.addEventListener('blur', () => {
    const newEmail = emailInput.value;actions.updateEmail(newEmail).then((result) => {
      if (result.error) {
        emailErrors.textContent = result.error.message;
      }
    });
  });
}
```

#### React

You must provide a valid customer email when completing a Checkout Session.

These instructions create an email input and use [updateEmail](https://docs.stripe.com/js/react_stripe_js/checkout/update_email) from the `Checkout` object.

Alternatively, you can:

- Pass in [customer_email](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_email), [customer_account](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer_account) (for customers represented as customer-configured `Account` objects), or [customer](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-customer) (for customers represented as `Customer` objects) when creating the Checkout Session. Stripe validates emails provided this way.
- Pass in an email you already validated on [confirm](https://docs.stripe.com/js/react_stripe_js/checkout/confirm).

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const EmailInput = () => {
  const checkoutState = useCheckout();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState(null);

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }

  const handleBlur = () => {checkoutState.checkout.updateEmail(email).then((result) => {
      if (result.type === 'error') {
        setError(result.error);
      }
    })
  };

  const handleChange = (e) => {
    setError(null);
    setEmail(e.target.value);
  };

  return (
    <div>
      <label htmlFor="checkout-form-email">Email</label>
      <input
        id="checkout-form-email"
        type="email"
        value={email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default EmailInput;
```

## Add the Payment Element [Client-side]

You can now replace the Card Element and individual payment method Elements with the Payment Element. The Payment Element automatically adjusts to collect input fields based on the payment method and country (for example, full billing address collection for SEPA Direct Debit) so you don’t have to maintain customized input fields anymore.

The following example replaces `CardElement` with `PaymentElement`:

#### HTML + JS

```html
<form id="payment-form"><div id="payment-element">
    <!-- Mount the Payment Element here -->
  </div>
  <button id="submit">Submit</button>
</form>
```

```javascript
const paymentElement = checkout.createPaymentElement();
paymentElement.mount("#payment-element");
```

#### React

```jsx
 return (
   <form className="CheckoutForm"><PaymentElement />
    <button id="submit">Submit</button>
  </form>
);
```

## Update the submit handler [Client-side]

Instead of using individual confirm methods like `stripe.confirmCardPayment` or `stripe.confirmP24Payment`, use [actions.confirm](https://docs.stripe.com/js/custom_checkout/confirm) to collect payment information and submit it to Stripe.

To confirm the Checkout Session, update your submit handler to use `actions.confirm` instead of individual confirm methods.

When called, `actions.confirm` tries to complete any [required actions](https://docs.stripe.com/payments/paymentintents/lifecycle.md), such as displaying a 3DS dialog or redirecting them to a bank authorization page. When confirmation is complete, it redirects customers to the `return_url` you configured, which normally corresponds to a page on your website that provides the [status of the payment](https://docs.stripe.com/payments/accept-a-payment.md#web-post-payment).

If you want to keep the same checkout flow for card payments and only redirect for redirect-based payment methods, set [redirect](https://docs.stripe.com/js/custom_checkout/confirm#custom_checkout_session_confirm-options-redirect) to `if_required`.

The following code example replaces `stripe.confirmCardPayment` with `actions.confirm`:

### Before

```javascript


const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);


  if (error) {
    handleError(error);
  }
};
```

### After

```javascript
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!stripe) {
    // Stripe.js hasn't yet loaded.
    // Make sure to disable form submission until Stripe.js has loaded.
    return;
  }

  setLoading(true);
const {error} = await actions.confirm();

  if (error) {
    handleError(error);
  }
};
```

## Monitor events

If you haven’t done so already, set up webhooks to listen to subscription change events, such as upgrades and cancellations. Learn more about [subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks.md). View events in the [Dashboard](https://dashboard.stripe.com/test/events) or with the [Stripe CLI](https://docs.stripe.com/webhooks.md#test-webhook).

See [testing your Billing integration](https://docs.stripe.com/billing/testing.md) for more details.

## Test the integration

1. Navigate to your checkout page.
1. Fill out the payment details with a payment method from the following table. For card payments:
   - Enter any future date for card expiry.
   - Enter any 3-digit number for CVC.
   - Enter any billing postal code.
1. Submit the payment to Stripe.
1. Go to the Dashboard and look for the payment on the [Transactions page](https://dashboard.stripe.com/test/payments?status%5B0%5D=successful). If your payment succeeded, you’ll see it in that list.
1. Click your payment to see more details, like billing information and the list of purchased items. Use this information to [fulfill the order](https://docs.stripe.com/checkout/fulfillment.md).

#### Cards

| Card number         | Scenario                                                                                                                                                                                                                                                                                      | How to test                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 4242424242424242    | The card payment succeeds and doesn’t require authentication.                                                                                                                                                                                                                                 | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000002500003155    | The card payment requires *authentication* (Strong Customer Authentication (SCA) is a regulatory requirement in effect as of September 14, 2019, that impacts many European online payments. It requires customers to use two-factor authentication like 3D Secure to verify their purchase). | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 4000000000009995    | The card is declined with a decline code like `insufficient_funds`.                                                                                                                                                                                                                           | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |
| 6205500000000000004 | The UnionPay card has a variable length of 13-19 digits.                                                                                                                                                                                                                                      | Fill out the credit card form using the credit card number with any expiration, CVC, and postal code. |

#### Wallets

| Payment method | Scenario                                                                                                                                                                     | How to test                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alipay         | Your customer successfully pays with a redirect-based and [immediate notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method. | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page. |

#### Bank redirects

| Payment method                         | Scenario                                                                                                                                                                                        | How to test                                                                                                                                                                                             |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BECS Direct Debit                      | Your customer successfully pays with BECS Direct Debit.                                                                                                                                         | Fill out the form using the account number `900123456` and BSB `000000`. The confirmed PaymentIntent initially transitions to `processing`, then transitions to the `succeeded` status 3 minutes later. |
| BECS Direct Debit                      | Your customer’s payment fails with an `account_closed` error code.                                                                                                                              | Fill out the form using the account number `111111113` and BSB `000000`.                                                                                                                                |
| Bancontact, EPS, iDEAL, and Przelewy24 | Your customer fails to authenticate on the redirect page for a redirect-based and immediate notification payment method.                                                                        | Choose any redirect-based payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                |
| Pay by Bank                            | Your customer successfully pays with a redirect-based and [delayed notification](https://docs.stripe.com/payments/payment-methods.md#payment-notification) payment method.                      | Choose the payment method, fill out the required details, and confirm the payment. Then click **Complete test payment** on the redirect page.                                                           |
| Pay by Bank                            | Your customer fails to authenticate on the redirect page for a redirect-based and delayed notification payment method.                                                                          | Choose the payment method, fill out the required details, and confirm the payment. Then click **Fail test payment** on the redirect page.                                                               |
| BLIK                                   | BLIK payments fail in a variety of ways—immediate failures (for example, the code is expired or invalid), delayed errors (the bank declines) or timeouts (the customer didn’t respond in time). | Use email patterns to [simulate the different failures.](https://docs.stripe.com/payments/blik/accept-a-payment.md#simulate-failures)                                                                   |

#### Bank debits

| Payment method    | Scenario                                                                                          | How to test                                                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEPA Direct Debit | Your customer successfully pays with SEPA Direct Debit.                                           | Fill out the form using the account number `AT321904300235473204`. The confirmed PaymentIntent initially transitions to processing, then transitions to the succeeded status three minutes later. |
| SEPA Direct Debit | Your customer’s payment intent status transitions from `processing` to `requires_payment_method`. | Fill out the form using the account number `AT861904300235473202`.                                                                                                                                |

#### Vouchers

| Payment method | Scenario                                          | How to test                                                                                            |
| -------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Boleto, OXXO   | Your customer pays with a Boleto or OXXO voucher. | Select Boleto or OXXO as the payment method and submit the payment. Close the dialog after it appears. |

See [Testing](https://docs.stripe.com/testing.md) for additional information to test your integration.

## See also

- [Collect billing and shipping addresses](https://docs.stripe.com/payments/collect-addresses.md?payment-ui=embedded-components)
- [Collect tax automatically](https://docs.stripe.com/payments/checkout/taxes.md?payment-ui=embedded-components)
- [Enable adjustable line item quantity](https://docs.stripe.com/payments/checkout/adjustable-quantity.md?payment-ui=embedded-components)
- [Configure free trials](https://docs.stripe.com/payments/checkout/free-trials.md?payment-ui=embedded-components)
- [Set the billing cycle date](https://docs.stripe.com/payments/checkout/billing-cycle.md?payment-ui=embedded-components)

