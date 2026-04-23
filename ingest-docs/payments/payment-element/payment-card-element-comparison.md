# Compare the Payment Element and Card Element

Select the right Element for your payment integration.

> The Card Element is a legacy integration with significantly less functionality than Payment Element. Stripe strongly recommends using the Payment Element to accept payments of all kinds, including card payments.

Previously, each payment method (for example, [cards](https://docs.stripe.com/payments/cards.md) and [iDEAL](https://docs.stripe.com/payments/ideal.md)) required integrating a separate Element. Now you can use the [Payment Element](https://docs.stripe.com/payments/payment-element.md) to accept payments from one or multiple payment methods, including cards and cards alongside other payment methods.

The Payment Element’s integration effort is the same as the Card Element and it supports all the common payment flows. The Payment Element also gives you instant access to additional payment methods, including [Google Pay](https://docs.stripe.com/google-pay.md) and [Apple Pay](https://docs.stripe.com/apple-pay.md). Accepting more [payment methods](https://docs.stripe.com/payments/payment-methods/overview.md) can help your business expand its global reach and improve checkout conversion.

Additionally, Stripe continues to develop and improve the Payment Element and its UI based on data from millions of transactions.

If you’re already using the [Card Element](https://docs.stripe.com/js/element/other_element?type=card), migrate to the [Payment Element](https://docs.stripe.com/js/element/payment_element) by following our [migration guide](https://docs.stripe.com/payments/payment-element/migration.md) to ensure you have the most up-to-date Stripe integration.

## Core Functionality

| Feature              | Card Element        | Payment Element                      |
| -------------------- | ------------------- | ------------------------------------ |
| Card payments        | ✓ Supported         | ✓ Supported                          |
| Card validation      | ⚠ Supported Basic   | ✓ Supported Enhanced                 |
| Card formatting      | ✓ Supported         | ✓ Supported Improved UX              |
| Card brand detection | ✓ Supported         | ✓ Supported Improved visuals         |
| Card brand detection | ✓ Optional Optional | ✓ Optional Optional with improved UX |

## Maintenance and updates

| Feature                            | Card Element              | Payment Element           |
| ---------------------------------- | ------------------------- | ------------------------- |
| Active development                 | ❌ Legacy Maintenance only | ✓ Supported               |
| Automatic updates                  | ⚠ Limited Limited         | ✓ Supported Comprehensive |
| Payment method requirement updates | ⚠ Manual Manual           | ✓ Automatic Automatic     |

## Payment method support

| Feature                                                                                          | Card Element  | Payment Element               |
| ------------------------------------------------------------------------------------------------ | ------------- | ----------------------------- |
| [Credit/debit cards](https://docs.stripe.com/payments/cards.md)                                  | ✓ Supported   | ✓ Supported                   |
| [Digital wallets](https://docs.stripe.com/payments/wallets.md) (such as Apple Pay or Google Pay) | ❌ Unsupported | ✓ Supported                   |
| [Bank debits](https://docs.stripe.com/payments/bank-debits.md) (such as ACH or SEPA)             | ❌ Unsupported | ✓ Supported                   |
| [Buy now, pay later](https://docs.stripe.com/payments/buy-now-pay-later.md)                      | ❌ Unsupported | ✓ Supported                   |
| Local payment methods                                                                            | ❌ Unsupported | ✓ Supported Over 100 methods  |
| [Link](https://docs.stripe.com/payments/link.md) by Stripe                                       | ✓ Supported   | ✓ Supported Enhanced features |
| [Link](https://docs.stripe.com/payments/link.md) by Stripe with multiple funding sources         | ❌ Unsupported | ✓ Supported Enhanced features |

## UX

| Feature                  | Card Element      | Payment Element                                                                               |
| ------------------------ | ----------------- | --------------------------------------------------------------------------------------------- |
| Appearance Customization | ⚠ Limited Limited | ✓ Supported Supports the [Appearance API](https://docs.stripe.com/elements/appearance-api.md) |
| Responsive design        | ⚠ Supported Basic | ✓ Supported Enhanced                                                                          |
| Accessibility features   | ⚠ Limited Limited | ✓ Supported Optimized                                                                         |
| Error messaging          | ⚠ Supported Basic | ✓ Supported Enhanced guidance                                                                 |
| Internationalization     | ⚠ Limited Limited | ✓ Supported Comprehensive                                                                     |
| Dynamic field validation | ⚠ Supported Basic | ✓ Supported Enhanced real-time validation                                                     |
| Autofill                 | ⚠ Supported Basic | ✓ Supported Enhanced                                                                          |

## Advanced features

| Feature                                                                                                | Card Element      | Payment Element      |
| ------------------------------------------------------------------------------------------------------ | ----------------- | -------------------- |
| [Dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md) | ❌ Unsupported     | ✓ Supported          |
| Saved payment method display                                                                           | ❌ Unsupported     | ✓ Supported          |
| [Advanced risk factors](https://docs.stripe.com/radar/optimize-risk-factors.md#important-risk-factors) | ❌ Unsupported     | ✓ Supported          |
| [3D Secure handling](https://docs.stripe.com/payments/3d-secure.md)                                    | ⚠ Supported Basic | ✓ Supported Enhanced |
| [SCA compliance](https://docs.stripe.com/strong-customer-authentication.md)                            | ⚠ Supported Basic | ✓ Supported Enhanced |
| Payment method rules                                                                                   | ❌ Unsupported     | ✓ Supported          |
| A/B testing                                                                                            | ❌ Unsupported     | ✓ Supported          |

## Integration and development

| Feature                                                   | Card Element               | Payment Element              |
| --------------------------------------------------------- | -------------------------- | ---------------------------- |
| Integration complexity                                    | :circle: Moderate Moderate | :circle: Moderate Moderate   |
| Dashboard configuration                                   | ⚠ Limited Limited          | ✓ Supported Extensive        |
| Server-side confirmation                                  | ✓ Supported                | ✓ Supported                  |
| Client-side confirmation                                  | ✓ Supported                | ✓ Supported                  |
| Set up future usage                                       | ✓ Supported                | ✓ Supported Enhanced options |
| [Subscriptions](https://docs.stripe.com/subscriptions.md) | ✓ Supported                | ✓ Supported Enhanced options |
| [Webhook](https://docs.stripe.com/webhooks.md) handling   | ✓ Supported                | ✓ Supported                  |
| Testing tools                                             | ⚠ Supported Basic          | ✓ Supported Enhanced         |

## Performance and security

| Feature                                                     | Card Element      | Payment Element      |
| ----------------------------------------------------------- | ----------------- | -------------------- |
| [PCI compliance](https://docs.stripe.com/security/guide.md) | ✓ Supported       | ✓ Supported          |
| Performance optimization                                    | ⚠ Supported Basic | ✓ Supported Enhanced |
| Fraud prevention                                            | ⚠ Supported Basic | ✓ Supported Enhanced |
| Risk assessment                                             | ⚠ Supported Basic | ✓ Supported Enhanced |
