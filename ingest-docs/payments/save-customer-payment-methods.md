# Save and retrieve customer payment methods

Learn about saved payment methods in the Payment Element.

You can save customer payment methods for future use with the Payment Element’s Saved Payment Method feature. This enables you to:

- Prompt buyers for [consent](https://docs.stripe.com/payments/save-during-payment.md?payment-ui=embedded-components#collect-consent) to save payment methods, such as `card`, `us_bank_account`, `acss_debit`, `sepa_debit`, `bacs_debit`, `au_becs_debit`, and `nz_bank_account`.
- Save payment methods when buyers provide GDPR-compliant consent for both one-time payments and recurring transactions.
- Display saved payment methods to buyers for future purchases. Customers can also remove and update their payment information.
- Configure the Payment Element to require CVC re-collection for a given transaction.

To integrate saved payment methods on the Payment Element, first learn to [Design an integration](https://docs.stripe.com/payments/payment-element/design-an-integration.md) if you’re new to using the Payment Element. If you have an existing Payment Element integration, look for the **Save and retrieve customer payment methods** step in the integration guide you followed to enable saved payment methods.

## Use saved payment methods with Link

[Link](https://docs.stripe.com/payments/link.md) is a network of saved payment methods that work across all Stripe users. You can use Link with Saved Payment Methods without any additional configuration.

- New customers can save their payment method to a specific business, Link, or both.
- Customers who have both a saved Link payment method and a saved business payment method see their business saved payment method displayed after the page loads.
![The Payment Element with Link and a saved payment method checkbox](https://b.stripecdn.com/docs-statics-srv/assets/spm-with-link.6bdc33f8d987d2183ded4ebf69e7a43d.png)

Save payment methods with Link.
![The Payment Element with a Saved payment method selected](https://b.stripecdn.com/docs-statics-srv/assets/spm-with-link-saved.d0bcd4ea872fd4123209aab8b28fc1ee.png)

Reuse a previously saved payment method.

## Re-collect payment details

For additional security, you can specify [require_cvc_recollection](https://docs.stripe.com/api/payment_intents/create.md#create_payment_intent-payment_method_options-card-require_cvc_recollection) to request the Payment Element to re-collect a CVC when a customer is paying with a card.

```javascript
payment_method_options: {
  card: {require_cvc_recollection: true}
}
```

## Save a payment method for a subscription or recurring transaction

If the **Save payment details for future purchases** checkbox appears and is selected when you’re confirming a payment, the payment method’s [allow_redisplay](https://docs.stripe.com/api/payment_methods/object.md#payment_method_object-allow_redisplay) value is set to `always`. This means the customer consents to use the payment method for the subscription and future sessions. If the customer leaves the checkbox unselected, the `allow_redisplay` value is set to `limited`. This means you can’t use the payment method for future purchases—it’s limited to the current subscription you’re setting up.

When multiple saved payment methods are redisplayed, the payment methods are displayed starting with the most recently added payment method. If a customer has a default payment method, the default payment method is always displayed first.

## Prevent payment method removal from subscriptions

If a payment method is saved for reuse and is also the payment method for an ongoing subscription, removing that payment method from the Payment Element’s **Saved** section also removes it from the subscription. We recommend that you [disable removing](https://docs.stripe.com/api/customer_sessions/object.md#customer_session_object-components-payment_element-features-payment_method_remove) saved payment methods from the Payment Element to avoid removing a payment method from an active subscription. Instead, manage payment methods in an account settings or similar page that shows existing subscriptions.

## Display existing saved payment methods

If existing payment methods are attached to customers in your Stripe account from a Card Element integration, direct use of the Stripe API, or some other method, those payment methods won’t render in the Payment Element because their `allow_redisplay` property is `unspecified`. If the `allow_redisplay` property is `always`, the payment method renders in the Payment Element.

You can use one of the following methods to display previously saved payment methods:

- If you collected the proper consent from the customer when saving the payment method, update `allow_redisplay` to `always`.
  - Use the [Payment Method update API](https://docs.stripe.com/api/payment_methods/update.md) to update an individual payment method.
- Configure the [Customer Session API](https://docs.stripe.com/api/customer_sessions/object.md#customer_session_object-components-payment_element-features-payment_method_allow_redisplay_filters) to include payment methods where `allow_redisplay="unspecified"`.

For both of these, a Customer Session is required for the Payment Element to redisplay saved payment methods.

## Collect consent to reuse a payment method outside of the Payment Element

The Payment Element uses the state of the **Save payment details for future purchases** checkbox to determine when a customer has given consent to save a payment method. If you’re collecting this consent a different way (such as with the terms and conditions of your website or consent text rendered outside of the Payment Element), you can override the consent that the Elements instance provides when confirming the intent.

If your integration uses [stripe.confirmPayment](https://docs.stripe.com/js/payment_intents/confirm_payment), [stripe.confirmSetup](https://docs.stripe.com/js/setup_intents/confirm_setup), or [stripe.createConfirmationToken](https://docs.stripe.com/js/confirmation_tokens/create_confirmation_token), pass an explicit [allow_redisplay](https://docs.stripe.com/js/payment_intents/confirm_payment#confirm_payment_intent-options-confirmParams-payment_method_data-allow_redisplay) value into the options hash to override the value from the Elements instance.
