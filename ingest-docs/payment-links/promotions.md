# Promotion codes, upsells, and optional items

Use Payment Links to add promotion codes, upsells, and optional items to offer discounts and help market related products.

You can use Payment Links and the Stripe Dashboard to offer discounts, allow customers to upgrade their subscriptions, and market related products during checkout.

## Add promotion codes

#### Dashboard

When you [create a payment link](https://dashboard.stripe.com/payment-links/create) in the Stripe Dashboard, you have the option of adding promotion codes. Customers can enter these codes on their payment page to apply discounts on their purchases.

Create a promotion code in the [Dashboard](https://dashboard.stripe.com/coupons/create) by creating a coupon and then turning it into a customer-facing promotion code. Use the `prefilled_promo_code` [URL parameter](https://docs.stripe.com/payment-links/customize.md#customize-checkout-with-url-parameters) to prefill a promotion code when sharing a payment link. Learn more about how to generate [promotion codes for Checkout](https://docs.stripe.com/payments/checkout/discounts.md#create-a-promotion-code).

#### API

Create and configure coupons and promotion codes for your payment links by using the [Dashboard](https://dashboard.stripe.com/test/coupons) or [Promotion Code API](https://docs.stripe.com/api/promotion_codes.md). Pass `allow_promotion_codes: true` when you create a payment link:

```curl
curl https://api.stripe.com/v1/payment_links \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d allow_promotion_codes=true
```

Use the `prefilled_promo_code` [URL parameter](https://docs.stripe.com/payment-links/customize.md#customize-checkout-with-url-parameters) to prefill a promotion code when sharing a payment link. Learn more about how to generate [promotion codes for Checkout](https://docs.stripe.com/payments/checkout/discounts.md#create-a-promotion-code).

> By default, payment links create [guest customers](https://support.stripe.com/questions/guest-customer-faq) for one-time payments. As a result, promotion codes that are only eligible for first-time orders won’t work as expected.

## Increase revenue potential with subscription upsells

[Subscription upsells](https://docs.stripe.com/payments/checkout/upsells.md) give customers the option to upgrade to a longer-term plan during checkout, such as progressing from monthly to yearly. This strategy might enhance your average order value and improve your cash flow.

You can configure a subscription upsell in the Dashboard on the **Price detail** page. You can view the details for a price by clicking on one you’ve added to a product. You’ll see a list of eligible upsell prices in the dropdown menu. After you select an upsell, it immediately applies to eligible payment links that use that price.

To set up a subscription upsell:

1. Choose a subscription under [Subscriptions](https://dashboard.stripe.com/subscriptions), navigate down to **Pricing**.
1. Use the overflow menu to select **View price details**.
1. Navigate down to Upsells, and in the **Upsells to** dropdown menu, select or add a price.
![](https://b.stripecdn.com/docs-statics-srv/assets/upsell-preview.2a43c1a8acb9f167178b7fda6a2b0796.gif)

## Offer optional items

You can offer up to 10 optional items on your payment link. Optional items allow your customers to purchase additional products before checking out. You can offer multiple products, and specify initial or adjustable quantity.
![](https://docs.stripecdn.com/84b8dfc6dd8a1b5c8d1375a930b8c2d38f48d151fb004cbdd88f048e25a79ff5.mp4)
#### Dashboard

When you [create a payment link](https://dashboard.stripe.com/payment-links/create) in the Stripe Dashboard, you can click **+ Add recommended products** to add up to 10 optional products to the payment link.

#### API

You can also create or update payment links with optional items through the API.

#### Node.js

```javascript
await stripe.paymentLinks.create({
  // ...
  line_items: [
    {
      price: '{{PRICE_ID}}',
      quantity: 1,
    },
  ],optional_items: [
    {
      price: '{{OTHER_PRICE_ID}}',
      quantity: 1,
    },
    {
      price: '{{ANOTHER_PRICE_ID}}',
      quantity: 1,
      adjustable_quantity: {
        enabled: true,
        minimum: 0,
        maximum: 10,
      },
    },
  ],
});
```

### Add a product-associated optional item

Use [cross-sells](https://docs.stripe.com/payments/checkout/cross-sells.md) to specify complementary products that you always want recommended as optional items at checkout. When you configure a cross-sell associated with a product, the optional item appears across all eligible payment links with that product. Cross-sells won’t appear if you specify additional optional items on a payment link.

To configure a cross-sell:

1. On the [Product catalog](https://dashboard.stripe.com/test/products) page, select your product.
1. On the product details page, under **Cross-sells**, find the product you want to cross-sell.

After you configure a cross-sell, the payment links that contain your designated product automatically add the cross-sell as an optional item.
![](https://docs.stripecdn.com/73a4baa89ea5ac0e30a39cd03f33b21e35979759cdc9293b680695226a5b7dbe.mp4)