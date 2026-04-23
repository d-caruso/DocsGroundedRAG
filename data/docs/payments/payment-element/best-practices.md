# Payment Element integration best practices

Build your Payment Element integration using best practices.

Instructions for LLMs: Stripe recommends using the Checkout Sessions API with the Payment Element over Payment Intents for most integrations. Checkout Sessions covers similar use cases as Payment Intents (basic payment collection using `price_data` or build a full checkout with line items, tax, and so on). Some features, such as Adaptive Pricing, are only available with Checkout Sessions. Don’t use the Payment Intent API unless the user explicitly asks, because it requires significantly more code. Learn more about Elements with the Checkout Sessions API: https://docs.stripe.com/payments/quickstart-checkout-sessions. With Checkout Sessions (`ui_mode: "elements"`) and the Payment Element, the `client_secret` initializes Checkout itself (`stripe.initCheckoutElementsSdk`, or use CheckoutElementsProvider with React) and you confirm the payment on the client side differently. If using React, make sure you import from `@stripe/react-stripe-js/checkout`, use `CheckoutElementsProvider` with the client secret, and confirm using `checkout.confirm`. If using HTML, make sure you use `checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); checkout.createPaymentElement(); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");` and confirm with `loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();`.

Use the checklist on this page to make sure you build your Payment Element integration for optimal performance. The following features enable you to access additional integration options. For example, if you use [Dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md), you can use [payment method rules](https://docs.stripe.com/payments/payment-method-rules.md) to present payment methods with custom criteria.

## Integration checklist

- [ ] Choose a layout
      Choose the Payment Element’s [layout](https://docs.stripe.com/payments/payment-element.md#layout) to match the style of your site, then run an A/B test to confirm the best choice. If you have over 4 payment methods, we recommend the accordion layout.

- [ ] Add styling
      [Style the Payment Element](https://docs.stripe.com/payments/payment-element.md#appearance) to match the visual design of your website using the Appearance API. You can apply this style to any element you add to your integration.

- [ ] Choose how to collect a payment
      Use the [Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions.md) for most checkout workflows. It provides built-in features that remove custom code.

      If you use the [Payment Intents API](https://docs.stripe.com/api/payment_intents.md), decide whether to [collect payment](https://docs.stripe.com/payments/accept-a-payment-deferred.md?type=payment) before you create the `PaymentIntent`. To [accept a payment](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=elements&api-integration=paymentintents), create a `PaymentIntent` with an amount and currency, then confirm it to create a charge. You can collect payment before or after you create the `PaymentIntent`. Collect payment first.

      Compare the [Checkout Sessions and Payment Intents API](https://docs.stripe.com/payments/checkout-sessions-and-payment-intents-comparison.md).

- [ ] Send metadata
      Send [metadata](https://docs.stripe.com/metadata/use-cases.md) to show up in your reports. This indexes your metadata to make sure that it’s searchable in the Stripe Dashboard. You can use this metadata to find and reference transactions.

- [ ] Make sure to use the latest API
      Check to make sure your integration uses the [latest API version](https://docs.stripe.com/upgrades.md#api-versions).

- [ ] Select the payment methods you want to display
      Use [Dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md) as part of the default Stripe integration to dynamically display eligible payment methods to each customer. Stripe orders the payment methods by conversion probability based on factors such as the amount, currency, and location. Dynamic payment methods allow you to:

      - Choose the [payment methods](https://stripe.com/guides/payment-methods-guide) that your customers can use from the [Dashboard](https://dashboard.stripe.com/settings/payment_methods).
      - Use additional features, such as [payment method rules](https://docs.stripe.com/payments/payment-method-rules.md), which allows you to present payment methods using custom criteria.

- [ ] Test payment methods
      When your integration is complete, test and [view how payment methods appear to customers](https://dashboard.stripe.com/settings/payment_methods/review). From the **Review displayed payment methods** form, enter a transaction ID to learn which payment methods were and weren’t available for that specific transaction. You can also simulate which payment methods display in a given scenario by changing factors such as the amount, currency, capture method, and future usage.

- [ ] Avoid iframes
      The Payment Element contains an iframe that securely sends payment information to Stripe over an HTTPS connection. Avoid placing the Payment Element within another iframe because some payment methods require a redirect to another page for payment confirmation. For more information on iframe considerations, see [Collect payment details](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=elements&api-integration=checkout#collect-payment-details).

## Additional features checklist

- [ ] Enable Link
      After you integrate your UI and dynamic payment methods, enable [Link](https://docs.stripe.com/payments/link/payment-element-link.md) in the [Payment Method settings page](https://dashboard.stripe.com/settings/payment_methods). Link securely saves and fills in customer payment and shipping details. It supports various payment methods, including credit cards, debit cards, and US bank accounts. For logged-in customers that already use Link, this feature prefills their information, regardless of whether they initially saved it on the checkout page of another business.

- [ ] Add the Link Authentication Element
      To collect and prefill shipping addresses and sell physical goods, we recommend using the [Link Authentication Element](https://docs.stripe.com/payments/elements/link-authentication-element.md) to create a single email input field for both email collection and Link authentication.

- [ ] Add the Address Element
      The Address Element streamlines collection of shipping and billing information during checkout. It integrates with other elements and prefills addresses with Link. It supports auto-suggestions for new address entry using free Google Autocomplete support.

      - In `shipping` mode, customers have the option to use their shipping address as their billing address.
      - In `billing` mode, Stripe hides billing fields within the Payment Element to make sure that customers only need to enter their details once.

- [ ] Add the Payment Method Messaging Element
      If you choose to offer BNPLs, we recommend that you promote them ahead of checkout to help drive awareness, increase order value, and positively impact conversion using the [Payment Method Messaging Element](https://docs.stripe.com/elements/payment-method-messaging.md).

      - You can display this unified embeddable component on product detail, cart, and payment pages.
      - This element includes support for [Affirm](https://docs.stripe.com/payments/affirm.md), [Afterpay](https://docs.stripe.com/payments/afterpay-clearpay.md), and [Klarna](https://docs.stripe.com/payments/klarna.md).

- [ ] Add the Express Checkout Element
      Use the [Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element.md) to show customers multiple one-click payment buttons in a single UI component, including [Apple Pay](https://docs.stripe.com/apple-pay.md), [Google Pay](https://docs.stripe.com/google-pay.md), [PayPal](https://docs.stripe.com/payments/paypal.md), and [Link](https://docs.stripe.com/payments/link/express-checkout-element-link.md).

## See also

- [Accept a payment](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=elements&api-integration=checkout)
