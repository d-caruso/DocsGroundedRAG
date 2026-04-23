# Design a custom integration

Learn which choices you need to make before building a custom Payment Element integration.

Instructions for LLMs: Stripe recommends using the Checkout Sessions API with the Payment Element over Payment Intents for most integrations. Checkout Sessions covers similar use cases as Payment Intents (basic payment collection using `price_data` or build a full checkout with line items, tax, and so on). Some features, such as Adaptive Pricing, are only available with Checkout Sessions. Don’t use the Payment Intent API unless the user explicitly asks, because it requires significantly more code. Learn more about Elements with the Checkout Sessions API: https://docs.stripe.com/payments/quickstart-checkout-sessions. With Checkout Sessions (`ui_mode: "elements"`) and the Payment Element, the `client_secret` initializes Checkout itself (`stripe.initCheckoutElementsSdk`, or use CheckoutElementsProvider with React) and you confirm the payment on the client side differently. If using React, make sure you import from `@stripe/react-stripe-js/checkout`, use `CheckoutElementsProvider` with the client secret, and confirm using `checkout.confirm`. If using HTML, make sure you use `checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); checkout.createPaymentElement(); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");` and confirm with `loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();`.

# Checkout Sessions API

> This is a Checkout Sessions API for when payment-ui is embedded-components. View the full page at https://docs.stripe.com/payments/payment-element/design-an-integration?payment-ui=embedded-components.

We recommend the Checkout Sessions API for most integrations. It covers similar use cases as Payment Intents, including one-time payments and complex checkout flows with tax, discounts, shipping, and subscriptions. It has one integration path, see the [Quickstart](https://docs.stripe.com/payments/quickstart-checkout-sessions.md) guide to learn more.


# Payment Intents API

> This is a Payment Intents API for when payment-ui is elements. View the full page at https://docs.stripe.com/payments/payment-element/design-an-integration?payment-ui=elements.

> The Payment Intents API is a lower-level API for building your own checkout flow. You must build and maintain checkout features yourself, including tax, discounts, shipping, and currency conversion. We recommend [Checkout Sessions](https://docs.stripe.com/payments/quickstart-checkout-sessions.md) for most integrations, it covers similar use cases as Payment Intents and more.

Before building your Payment Element integration with the Payment Intents API, choose an integration path that aligns with your business requirements.

The diagram below provides an overview of the integration guides available when integrating the Payment Element.
 (See full diagram at https://docs.stripe.com/payments/payment-element/design-an-integration)
The sections below demonstrate the two architectural choices required when integrating the Payment Element.

## Choose when to create the PaymentIntent or SetupIntent object

The Payment Element collects payment information from your customer and populates it onto either a [PaymentIntent](https://docs.stripe.com/api/payment_intents.md) or a [SetupIntent](https://docs.stripe.com/api/setup_intents.md) object, depending on whether you’re collecting payment or setting up a payment method for future use. When a customer enters your checkout, you can either:

- **Create only the Payment Element**: Defer creating and confirming the PaymentIntent or SetupIntent until the customer submits the payment form by pressing the **Pay** button. Choose this option if:

  - You have a multi-page checkout flow where the page for collecting payment details comes before the page for payment submission or order summary. Learn how to [build two-step confirmation](https://docs.stripe.com/payments/build-a-two-step-confirmation.md).

  - You have a dynamic checkout page where the amount can change based on customer selections, such as changing the items or quantity of items being purchased, or adding discount codes. By deferring Intent creation until after the customer presses **Pay**, you eliminate the need to synchronize your Intent with the changes made on the client. This is necessary because changes to amount affect the eligibility of certain payment methods. Learn how to [collect payment details before creating a PaymentIntent](https://docs.stripe.com/payments/accept-a-payment-deferred.md) if you’re confirming the Intent on your client and how to [finalize payments on the server](https://docs.stripe.com/payments/finalize-payments-on-the-server.md) if you’re confirming the Intent on your server.

- **Create both the PaymentIntent/SetupIntent and the Payment Element**: Create the PaymentIntent or SetupIntent before loading the checkout page and then create the Payment Element, associating the two by providing the Intent’s `client_secret` [as a parameter when creating the Elements object](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-clientSecret). Choose this option if:

  - You have a static checkout page and want to quickly set up your integration. Learn how to [accept a payment](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=elements&api-integration=paymentintents).

## Choose where to confirm the PaymentIntent or SetupIntent

Payment information collected by the Payment Element is transferred onto the PaymentIntent or SetupIntent at confirmation time. When the customer presses **Pay**, you can either:

- **Confirm the PaymentIntent/SetupIntent on your client**: Code on your client calls a Stripe SDK, which invokes the API to confirm the Intent. The Stripe SDK also automatically handles additional next actions that might be required, such as authenticating with [3D Secure](https://docs.stripe.com/payments/3d-secure.md), and also localizes [error](https://docs.stripe.com/api/errors.md) messages. Choose this option if:

  - You don’t require the additional control of confirming the Intent on your server, and you prefer the quickest integration.

- **Confirm the PaymentIntent/SetupIntent on your server**: Code on your server directly invokes the API to confirm the Intent. If next actions are required, you must handle them either manually or by using a Stripe SDK, for example [stripe.handleNextAction](https://docs.stripe.com/js/payment_intents/handle_next_action). Choose this option if:

  - You have to execute business logic on your server before the confirmation, such as payment method restrictions or adjusting application fees. After your business logic runs, immediately confirm the Intent on your server to guarantee that the client can’t make any changes that could invalidate your business logic.

