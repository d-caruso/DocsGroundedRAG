# Manual currency prices

Learn how to manually present local currencies to customers.

Manual currency prices isn’t supported on the [Payment Intents API](https://docs.stripe.com/api/payment_intents.md).

You can manually define prices in different currencies when you create [products](https://docs.stripe.com/products-prices/overview.md#get-started). Use manual currency prices when:

- You’re supporting a region where you can accept fluctuations in the currency’s exchange rate.
- Adaptive Pricing isn’t [supported](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md#restrictions) for your business or checkout configuration.

Multi-currency prices that you manually define override Adaptive Pricing for those currencies, even if it’s enabled.

Although Stripe supports manual currency prices, we recommend using [Adaptive Pricing](https://docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing.md) to reduce the risk of currency exchange rate fluctuations and to automatically enable support for over 100 local currencies. Contact [adaptive-pricing-beta@stripe.com](mailto:adaptive-pricing-beta@stripe.com) to request to join the preview.

## Create a multi-currency price [Dashboard] [Server-side]

#### Dashboard

1. Go to a product in the [Dashboard](https://dashboard.stripe.com/products?active=true).
1. Click  **+Add another price** to create a new price.
1. Fill in the price and select a currency. This first currency is the price’s default currency. Make sure all of your prices have the same default currency.
1. Click **+Add a price by currency** to search and select from supported currencies, adding them to your price.
1. Use the multi-currency price you created by passing its ID into [line items](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price) when you create a Checkout Session.

#### API

Add multiple currencies to a Price by specifying `currency_options` when using the [Prices API](https://docs.stripe.com/api/prices/object.md#price_object-currency_options).

```curl
curl https://api.stripe.com/v1/prices \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d currency=usd \
  -d unit_amount=1000 \
  -d "currency_options[eur][unit_amount]=950" \
  -d "currency_options[jpy][unit_amount]=1500" \
  -d "product_data[name]=My Product"
```

In this example, the Price is created in USD, with additional currency options in EUR and JPY.

## Create a Checkout Session [Server-side]

Create a Checkout Session using the multi-currency price:

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d ui_mode=elements \
  --data-urlencode "return_url=https://example.com/return"
```

## Test local currency presentment [Server-side] [Client-side]

To test local currency presentment, pass a customer email address that includes a suffix formatted as `+location_XX`. Make sure the `XX` value is a valid [two-letter ISO country code](https://www.nationsonline.org/oneworld/country_code_list.htm).

For example, to test currency presentment for a customer in France, pass an email formatted as `test+location_FR@example.com`. When you visit the Checkout Session URL created with a location-formatted email, you see the same currency that a customer sees in the specified country.

When you create a Checkout Session, pass the location-formatted email as [customer_email](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-customer_email) to simulate a particular country.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u <<YOUR_SECRET_KEY>>: \
  -d "line_items[0][price]"="{{PRICE_ID}}" \
  -d "line_items[0][quantity]"=1 \
  -d mode=payment \
  -d ui_mode=embedded_page \
  -d return_url="https://example.com/return" \
  --data-urlencode customer_email="test+location_FR@example.com"
```

You can also create a new customer-configured [Account](https://docs.stripe.com/api/v2/core/accounts/object.md#v2_account_object-configuration-customer) or [Customer](https://docs.stripe.com/api/customers/create.md) and specify an email address that contains the `+location_XX` suffix. Stripe test cards work as usual.

When it’s possible to present the customer’s local currency, the [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md) object changes. The `currency`, `payment_method_types`, and `amount_total` fields reflect the local currency and price.

## Optional: Specify a currency [Server-side]

When you use multi-currency prices, the Checkout Session automatically handles currency localization for your customers. If you want to override this behavior, you can specify a currency when you create the Checkout Session.

In the following example, the currency for the Checkout Session is always EUR, regardless of the customer’s location.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d currency=eur \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d ui_mode=elements \
  --data-urlencode "return_url=https://example.com/return"
```

## Local payment methods 

The Checkout Session presents customers with popular payment methods compatible with their local currencies. For example, for customers located in the Netherlands, the Checkout Session converts prices to EUR and also present popular Dutch payment methods like iDEAL.

You can configure which payment methods you accept in your [payment methods settings](https://dashboard.stripe.com/settings/payment_methods).

## Supported integrations 

The Checkout Session automatically presents the local currency to customers when the following are true:

- The prices, shipping rates, and discounts for the Checkout Session have the relevant currency in the `currency_options`.
- For a Checkout Session using Stripe Tax, the `tax_behavior` is specified for the relevant currency for all prices, shipping rates, and discounts for the Checkout Session.
- You didn’t specify a currency when creating the Checkout Session.

If the relevant currency option or `tax_behavior` is missing, the Checkout Session presents the default currency to the customer. The default currency must be the same across all prices, shipping rates, and discounts.

### Restrictions 

Price localization isn’t available for Checkout Sessions that:

- Use manual tax rates
- Use `payment_intent_data.application_fee_amount` or `payment_intent_data.transfer_data.amount`

## Fees 

Stripe’s standard transaction fees apply to automatically converted transactions:

- Cards or payment methods fee
- International cards or payment methods fee (if applicable)
- Currency conversion fee

See the [pricing page](https://stripe.com/pricing) for more details about these fees.
