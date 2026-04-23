# Customize payment methods

Choose how the Payment Element displays payment methods.

The Payment Element supports many payment methods. It displays the payment methods you enabled, hides any that won’t work for the current transaction, and sorts them dynamically for the best conversion rates.

You can customize its behavior in these ways:

- [Enable different payment methods](https://docs.stripe.com/payments/customize-payment-methods.md#enable-different-payment-methods).
- [Sort payment methods](https://docs.stripe.com/payments/customize-payment-methods.md#sort-payment-methods) differently than the default.
- [Limit the number of payment methods](https://docs.stripe.com/payments/customize-payment-methods.md#limit-payment-method-count) displayed.

## Enable different payment methods 

You can specify [Dynamic payment methods](https://docs.stripe.com/payments/payment-methods/dynamic-payment-methods.md) to enable different payment methods by selecting them in the [Dashboard](https://dashboard.stripe.com/settings/payment_methods). Stripe enables this functionality by default in the latest version of the API.

This allows Stripe to pull your payment method preferences from the Dashboard to dynamically show the most relevant payment methods to your customers. Alternatively, you can [list payment methods](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-payment_method_types) manually using payment method types.

There’s one situation where the Payment Element overrides your choice. It hides payment methods that don’t support the current payment. For instance, in a recurring payment for 10 JPY, the Payment Element hides methods that don’t support JPY or recurring payments.

## Sort payment methods 

By default, the Payment Element uses dynamic ordering to optimize which payment methods appear for each user. With the [paymentMethodOrder](https://docs.stripe.com/js/elements_object/create_payment_element#payment_element_create-options-paymentMethodOrder) parameter, you can override the default order for payment methods in the Payment Element, including Apple Pay and Google Pay.

Payment methods that you specify in `paymentMethodOrder` are shown first, followed by any additional payment methods. If you specify payment method types that Stripe wouldn’t show, they’re ignored.

```javascript
elements.create('payment', {
  paymentMethodOrder: ['apple_pay', 'google_pay', 'card', 'klarna']
});
```

You can include Apple Pay (`apple_pay`) and Google Pay (`google_pay`) when setting the order for payment methods in addition to a full list of [payment method types](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-type). When you specify sorting, Stripe applies dynamic ordering to any remaining available payment methods.

> Regulations in [Finland](https://support.stripe.com/questions/payment-method-legislation-in-finland) and [Sweden](https://support.stripe.com/questions/payment-method-legislation-in-sweden) require that debit payment methods must be presented before credit payment methods at checkout in those countries.

## Limit the number of payment methods 

When you use the [accordion layout](https://docs.stripe.com/payments/payment-element.md#layout), the Payment Element displays up to five payment methods by default and hides the rest behind a **More** button.

To adjust the number of payment methods you want to display, set the [layout.visibleAccordionItemsCount](https://docs.stripe.com/js/elements_object/create_payment_element#payment_element_create-options-layout-visibleAccordionItemsCount) property.

```javascript
elements.create('payment', {
  layout: {
    type: 'accordion',
    // Set a different default, or set to 0 to disable the
    // "More" button and render all available Payment Methods
    visibleAccordionItemsCount: 3
  }
});
```
