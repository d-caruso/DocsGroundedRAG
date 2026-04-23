# Collect physical addresses and phone numbers

Learn how to collect addresses and phone numbers during one-time payment flows.

To collect complete addresses for billing or shipping, use the [Address Element](https://docs.stripe.com/elements/address-element.md). You might need to [collect a full billing address to calculate taxes](https://docs.stripe.com/tax/custom.md#collect-address), for example. The [Payment Element](https://docs.stripe.com/payments/payment-element.md) only collects the billing address details required to complete the payment, but you can configure it to collect other billing details.

Other reasons you might want to use the Address Element:

- To collect customer [phone numbers](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options-fields-phone)
- To enable [autocomplete](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options-autocomplete)
- To prefill billing information in the Payment Element by passing in a shipping address

Stripe combines the collected address information and the payment method to create a *PaymentIntent* (API object that represents your intent to collect payment from a customer, tracking charge attempts and payment state changes throughout the process).

# Checkout Sessions API

> This is a Checkout Sessions API for when payment-ui is embedded-components. View the full page at https://docs.stripe.com/payments/advanced/collect-addresses?payment-ui=embedded-components.

## Set up Stripe [Server-side]

First, [create a Stripe account](https://dashboard.stripe.com/register) or [sign in](https://dashboard.stripe.com/login).

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

## Collect address details [Client-side]

You’re ready to collect address details on the client with the Address Element.

#### HTML + JS

### Set up Stripe.js

The Address Element is automatically available as a feature of Stripe.js. Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from js.stripe.com to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
```

### Create a Stripe instance and initialize the checkout

Create an instance of Stripe on your checkout page:

```javascript
// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');

let checkout;
initialize();
async function initialize() {
  const promise = fetch("/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((r) => r.json())
    .then((r) => r.clientSecret);

  const appearance = {
    theme: 'stripe',
  };
  checkout = stripe.initCheckoutElementsSdk({
    clientSecret: promise,
    elementsOptions: { appearance },
  });
}
```

### Add the Address Element to your page

The Address Element needs a place on your page. Create an empty DOM node (container) with a unique ID in your form.

```html
<form id="address-form">
  <h4>Billing Address</h4>
  <div id="billing-address-element">
    <!--Stripe.js injects the Address Element-->
  </div>
  <h4>Shipping Address</h4>
  <div id="shipping-address-element">
    <!--Stripe.js injects the Address Element-->
  </div>
</form>
```

After this form loads, create an instance of the Address Element to collect a [billing](https://docs.stripe.com/js/custom_checkout/create_billing_address_element)  or [shipping](https://docs.stripe.com/js/custom_checkout/create_shipping_address_element) address, and mount it to the container DOM node.

If you already created a [Checkout](https://docs.stripe.com/js/custom_checkout/init) instance, you can use the same instance to create the Address Element. Otherwise, create a new [Checkout](https://docs.stripe.com/js/custom_checkout/init) instance first.

```javascript
const options = {
  // Fully customizable with the Appearance API.
  appearance: { /* ... */ }
};
const billingAddressElement = checkout.createBillingAddressElement();
billingAddressElement.mount("#billing-address-element");
const shippingAddressElement = checkout.createShippingAddressElement();
shippingAddressElement.mount("#shipping-address-element");
```

#### React

### Set up Stripe.js

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry.

```bash
npm install --save @stripe/react-stripe-js @stripe/stripe-js
```

### Add and configure the CheckoutElementsProvider to your page

To use the Address Element component, wrap your checkout page in a [CheckoutElementsProvider](https://docs.stripe.com/sdks/stripejs-react.md?ui=embedded-components#checkout-provider). Call `loadStripe` with your publishable key. Pass the returned `Promise` to the `CheckoutElementsProvider`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import {CheckoutElementsProvider} from '@stripe/react-stripe-js/checkout';
import {loadStripe} from '@stripe/stripe-js';

import AddressForm from './AddressForm';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

function App() {
  const promise = useMemo(() => {
    return fetch('/create-checkout-session', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, []);

  const appearance = {
    // Fully customizable with appearance API.
  };

  return (
    <CheckoutElementsProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret: () => promise,
        elementsOptions: {appearance},
      }}
    >
      <AddressForm />
    </CheckoutElementsProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```

### Add the Address Element components

Use the `BillingAddressElement` or `ShippingAddressElement` components to build your form.

#### Billing

```jsx
import React from 'react';
import {BillingAddressElement} from '@stripe/react-stripe-js/checkout';

const AddressForm = () => {
  return (
    <form>
      <h3>Billing</h3><BillingAddressElement />
    </form>
  );
};

export default AddressForm;
```

#### Shipping

```jsx
import React from 'react';
import {ShippingAddressElement} from '@stripe/react-stripe-js/checkout';

const AddressForm = () => {
  return (
    <form>
      <h3>Shipping</h3><ShippingAddressElement />
    </form>
  );
};

export default AddressForm;
```

## Retrieve address details [Client-side]

You can retrieve the address details by listening to the [change](https://docs.stripe.com/js/custom_checkout/events) event. The `change` event fires whenever the user updates any field in the Element.

#### HTML + JS

```javascript
checkout.on('change', (event) => {
  if (event.complete){
    // Extract potentially complete address
    const address = event.value.address;
  }
})
```

#### React

```jsx
<BillingAddressElement onChange={(event) => {
  if (event.complete) {
    // Extract potentially complete address
    const address = event.value.address;
  }
}} />
```

In a single-page checkout flow with the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the Address Element automatically passes the shipping or billing information when you *confirm* (Confirming an intent indicates that the customer intends to use the current or provided payment method. Upon confirmation, the intent attempts to initiate the portions of the flow that have real-world side effects) the Checkout Session.

## Configure the Address Element [Client-side]

You can configure the Address Element to suit your needs.

### Autocomplete

The Address Element has a built-in address autocomplete feature that uses the [Google Maps API Places Library](https://developers.google.com/maps/documentation/javascript/places). By default, the autocomplete is enabled with a Stripe-provided Google Maps API key, if any of the following conditions are met:

- In a single page checkout flow where the [Payment Element](https://docs.stripe.com/payments/payment-element.md) is mounted in the same Elements group as the Address Element.
- In a checkout flow that uses the Address Element in an active [Link](https://docs.stripe.com/payments/link.md) session.

### Prefill address form

You can use [updateBillingAddress](https://docs.stripe.com/js/custom_checkout/update_billing_address) or [updateShippingAddress](https://docs.stripe.com/js/custom_checkout/update_shipping_address) to prefill an address.

#### HTML + JS

```javascript
actions.updateBillingAddress({
  name: 'Jenny Rosen',
  address: {
    line1: '27 Fredrick Ave',
    city: 'Brothers',
    state: 'OR',
    postal_code: '97712',
    country: 'US',
  }
});
```

#### React

```jsx
const {updateBillingAddress} = useCheckout();
updateBillingAddress({
  address: {
    line1: '27 Fredrick Ave',
    city: 'Brothers',
    state: 'OR',
    postal_code: '97712',
    country: 'US',
  }
});
```

## Validate address details [Client-side]

Stripe provides a few ways to validate completeness of an address and trigger errors to display on any incomplete individual address fields. For example, “This field is incomplete.”

You can validate addresses by confirming the Checkout Session, which automatically validates the Address Element and displays any validation errors.

## Optional: Customize the appearance [Client-side]

After you add the Address Element to your page, you can customize the appearance to fit with the design of the rest of your page. See the [Appearance API](https://docs.stripe.com/elements/appearance-api.md) page for more information.
![](https://b.stripecdn.com/docs-statics-srv/assets/appearance_example.e076cc750983bf552baf26c305e7fc90.png)

### Use the Address Element with other elements

You can collect both shipping and billing addresses by using multiple Address Elements on your page.

If you need to collect both shipping and billing addresses and want to use only one Address Element, use the Shipping Address Element along with the [Payment Element](https://docs.stripe.com/payments/payment-element.md), which collects only the necessary billing address details.

When you use the Address Element with other elements, there is some automatic behavior when confirming the Checkout Session. The Address Element validates completeness when confirming the Checkout Session, and then displays errors for each field if there are any validation errors.

### Sync billing and shipping addresses 

When you use both a Billing Address Element and Shipping Address Element, you can show a checkbox that lets customers sync their billing and shipping addresses.

#### HTML + JS

Pass the [syncAddressCheckbox](https://docs.stripe.com/js/custom_checkout/init#custom_checkout_init-options-elementsOptions-syncAddressCheckbox) option in `elementsOptions` when initializing Checkout to configure which Address Element shows the checkbox.

```javascript
const checkout = stripe.initCheckoutElementsSdk({
  clientSecret,
  elementsOptions: {
    syncAddressCheckbox: 'shipping',
  },
});
```

#### React

Pass the [syncAddressCheckbox](https://docs.stripe.com/js/react_stripe_js/checkout/checkout_provider#react_checkout_provider-options-elementsOptions-syncAddressCheckbox) option in `elementsOptions` to the `CheckoutElementsProvider` to configure which Address Element shows the checkbox.

```jsx
<CheckoutElementsProvider
  stripe={stripePromise}
  options={{
    fetchClientSecret: () => promise,
    elementsOptions: {
      syncAddressCheckbox: 'shipping',
    },
  }}
>
  <CheckoutForm />
</CheckoutElementsProvider>
```

Set the value to `'billing'` or `'shipping'` to choose which Address Element shows the checkbox. Set it to `'none'` to hide the checkbox, or leave it blank to use the default value (`'billing'`).

## See also

- [Use the address](https://docs.stripe.com/elements/address-element.md?platform=web#use-an-address)
- [Set up autofill with Link](https://docs.stripe.com/elements/address-element.md?platform=web#autofill-with-link-brand-name)
- [Customize the form’s appearance](https://docs.stripe.com/elements/address-element.md?platform=web#appearance)


# Payment Intents API

> This is a Payment Intents API for when payment-ui is elements. View the full page at https://docs.stripe.com/payments/advanced/collect-addresses?payment-ui=elements.

## Set up Stripe [Server-side]

First, [create a Stripe account](https://dashboard.stripe.com/register) or [sign in](https://dashboard.stripe.com/login).

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
# Available as a gem
sudo gem install stripe
```

```ruby
# If you use bundler, you can add this line to your Gemfile
gem 'stripe'
```

## Collect address details [Client-side]

You’re ready to collect address details on the client with the Address Element.

#### HTML + JS

### Set up Stripe.js

The Address Element is automatically available as a feature of Stripe.js. Include the Stripe.js script on your checkout page by adding it to the `head` of your HTML file. Always load Stripe.js directly from js.stripe.com to remain PCI compliant. Don’t include the script in a bundle or host a copy of it yourself.

```html
<head>
  <title>Checkout</title>
  <script src="https://js.stripe.com/dahlia/stripe.js"></script>
</head>
```

### Create a Stripe instance

Create an instance of Stripe on your payment page:

```javascript
// Set your publishable key: remember to change this to your live publishable key in production
// See your keys here: https://dashboard.stripe.com/apikeys
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>');
```

### Add the Address Element to your page

The Address Element needs a place on your page. Create an empty DOM node (container) with a unique ID in your form.

```html
<form id="address-form">
  <h3>Address</h3>
  <div id="address-element">
    <!-- Elements will create form elements here -->
  </div>
</form>
```

After this form loads, create an instance of the Address Element, specify the address [mode](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options-mode), and mount it to the container DOM node.

If you already created an [Elements](https://docs.stripe.com/js/elements_object/create) instance, you can use the same instance to create the Address Element. Otherwise, create a new [Elements](https://docs.stripe.com/js/elements_object/create) instance first.

#### Shipping

```javascript
const options = {
  // Fully customizable with the Appearance API.
  appearance: { /* ... */ }
};

// Only need to create this if no elements group exist yet.
// Create a new Elements instance if needed, passing the
// optional appearance object.
const elements = stripe.elements(options);
// Create and mount the Address Element in shipping mode
const addressElement = elements.create("address", {
  mode: "shipping",
});
addressElement.mount("#address-element");
```

#### Billing

```javascript
const options = {
  // Fully customizable with appearance API.
  appearance: { /* ... */ }
};

// Only need to create this if no elements group exist yet.
// Create a new Elements instance if needed, passing the
// optional appearance object.
const elements = stripe.elements(options);
// Create and mount the Address Element in billing mode
const addressElement = elements.create("address", {
  mode: "billing",
});
addressElement.mount("#address-element");
```

#### React

### Set up Stripe.js

Install [React Stripe.js](https://www.npmjs.com/package/@stripe/react-stripe-js) and the [Stripe.js loader](https://www.npmjs.com/package/@stripe/stripe-js) from the npm public registry.

```bash
npm install --save @stripe/react-stripe-js @stripe/stripe-js
```

### Add and configure the Elements provider to your page

To use the Address Element component, wrap your payment page component in an [Elements provider](https://docs.stripe.com/sdks/stripejs-react.md#elements-provider). Call `loadStripe` with your publishable key. Pass the returned `Promise` to the `Elements` provider.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

import AddressForm from './AddressForm';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripe = loadStripe('<<YOUR_PUBLISHABLE_KEY>>');

function App() {
  const options = {
    // Fully customizable with appearance API.
    appearance: {/*...*/},
  };

  return (
    <Elements stripe={stripe} options={options}>
      <AddressForm />
    </Elements>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
```

### Add the Address Element component

Use the `AddressElement` component to build your form.

#### Shipping

```jsx
import React from 'react';
import {AddressElement} from '@stripe/react-stripe-js';

const AddressForm = () => {
  return (
    <form>
      <h3>Shipping</h3><AddressElement options={{mode: 'shipping'}} />
    </form>
  );
};

export default AddressForm;
```

#### Billing

```jsx
import React from 'react';
import {AddressElement} from '@stripe/react-stripe-js';

const AddressForm = () => {
  return (
    <form>
      <h3>Billing</h3><AddressElement options={{mode: 'billing'}} />
    </form>
  );
};

export default AddressForm;
```

## Retrieve address details [Client-side]

You can retrieve the address details by listening to the [change](https://docs.stripe.com/js/element/events/on_change?type=addressElement) event. The `change` event triggers whenever your customer updates a field in the Element.

#### HTML + JS

```javascript
addressElement.on('change', (event) => {
  if (event.complete){
    // Extract potentially complete address
    const address = event.value.address;
  }
})
```

#### React

```jsx
<AddressElement onChange={(event) => {
  if (event.complete) {
    // Extract potentially complete address
    const address = event.value.address;
  }
}} />
```

Alternatively, you can use [getValue](https://docs.stripe.com/js/elements_object/get_value_address_element).

```javascript
const handleNextStep = async () => {
  const addressElement = elements.getElement('address');

  const {complete, value} = await addressElement.getValue();

  if (complete) {
    // Allow user to proceed to the next step
    // Optionally, use value to store the address details
  }
};
```

In a single-page checkout flow with the [Payment Element](https://docs.stripe.com/payments/payment-element.md), the Address Element automatically passes the shipping or billing information when you *confirm* (Confirming an intent indicates that the customer intends to use the current or provided payment method. Upon confirmation, the intent attempts to initiate the portions of the flow that have real-world side effects) the PaymentIntent or SetupIntent.

In a multi-page checkout flow, you can manually [update the PaymentIntent](https://docs.stripe.com/api/payment_intents/update.md) or [update the Customer object](https://docs.stripe.com/api/customers/update.md) with the address details received from the `change` event or `getValue` method before moving to the next step.

## Configure the Address Element [Client-side]

You can configure the Address Element to suit your needs.

### Autocomplete

The Address Element has a built-in address autocomplete feature that uses the [Google Maps API Places Library](https://developers.google.com/maps/documentation/javascript/places). By default, the autocomplete is enabled with a Stripe-provided Google Maps API key if any of the following conditions are met:

- In a single page checkout flow where the [Payment Element](https://docs.stripe.com/payments/payment-element.md) is mounted in the same Elements group as the Address Element.
- In a checkout flow that uses the Address Element in an active [Link](https://docs.stripe.com/payments/link.md) session.

To enable autocomplete in the Address Element for all other scenarios, you can use the [autocomplete](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options-autocomplete) option with `mode` set to `google_maps_api`. Set the `apiKey` to your own [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key#create-api-keys) that’s configured to allow the [Places API](https://developers.google.com/maps/documentation/javascript/places#add-places-api-to-the-api-keys-api-restrictions-list) usage. Your Google Maps API key is only used when the Stripe-provided Google Maps API key isn’t available.

> If you’ve deployed a [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) and want to enable autocomplete with your own Google Maps API key, include `https://maps.googleapis.com` as a `connect-src` and `script-src` directive. Refer to the [Google Maps API official guide](https://developers.google.com/maps/documentation/javascript/content-security-policy) for the most updated CSP requirement.

#### HTML + JS

```javascript
const addressElement = elements.create("address", {
  mode: "shipping",autocomplete: {
    mode: "google_maps_api",
    apiKey: "{YOUR_GOOGLE_MAPS_API_KEY}",
  },
});
```

#### React

```jsx
<AddressElement options={{
  mode: "shipping",autocomplete: {
    mode: "google_maps_api",
    apiKey: "{YOUR_GOOGLE_MAPS_API_KEY}",
  },
}} />
```

### Prefill address form

The Address Element accepts [defaultValues](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options-defaultValues), which lets you prefill the address form when the page loads. An Address Element with all values prefilled looks similar to:

#### HTML + JS

```javascript
const addressElement = elements.create("address", {
  mode: "shipping",defaultValues: {
    name: 'Jane Doe',
    address: {
      line1: '354 Oyster Point Blvd',
      line2: '',
      city: 'South San Francisco',
      state: 'CA',
      postal_code: '94080',
      country: 'US',
    },
  }
});
```

#### React

```jsx
<AddressElement options={{
  mode: "shipping",defaultValues: {
    name: 'Jane Doe',
    address: {
      line1: '354 Oyster Point Blvd',
      line2: '',
      city: 'South San Francisco',
      state: 'CA',
      postal_code: '94080',
      country: 'US',
    },
  },
}} />
```

### Other options

Refer to [Stripe.js](https://docs.stripe.com/js/elements_object/create_address_element#address_element_create-options) for the complete list of options in detail.

#### HTML + JS

```javascript
// Sample of a options object
const addressElement = elements.create("address", {
  mode: 'shipping',
  allowedCountries: ['US'],
  blockPoBox: true,
  fields: {
    phone: 'always',
  },
  validation: {
    phone: {
      required: 'never',
    },
  },
});
```

#### React

```jsx
// Sample of a options object
<AddressElement options={{
  mode: 'shipping',
  allowedCountries: ['US'],
  blockPoBox: true,
  fields: {
    phone: 'always',
  },
  validation: {
    phone: {
      required: 'never',
    },
  },
}} />
```

## Validate address details [Client-side]

Stripe provides a few ways to validate completeness of an address and trigger errors to display on any incomplete individual address fields. For example, “This field is incomplete.”

If you use the Address Element with a PaymentIntent or SetupIntent, use [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment) or [stripe.confirmSetup](https://docs.stripe.com/js/setup_intents/confirm_setup), respectively to complete the Intent. Validation errors, if any, appear in the Address Element.

For other use cases, such as a multi-page checkout flow, use [getValue](https://docs.stripe.com/js/elements_object/get_value_address_element) to trigger validation errors to display in the Address Element.

## Optional: Customize the appearance [Client-side]

After you add the Address Element to your page, you can customize the appearance to fit with the design of the rest of your page. See the [Appearance API](https://docs.stripe.com/elements/appearance-api.md) page for more information.
![](https://b.stripecdn.com/docs-statics-srv/assets/appearance_example.e076cc750983bf552baf26c305e7fc90.png)

## See also

- [Use the address](https://docs.stripe.com/elements/address-element.md?platform=web#use-an-address)
- [Set up autofill with Link](https://docs.stripe.com/elements/address-element.md?platform=web#autofill-with-link-brand-name)
- [Customize the form’s appearance](https://docs.stripe.com/elements/address-element.md?platform=web#appearance)

