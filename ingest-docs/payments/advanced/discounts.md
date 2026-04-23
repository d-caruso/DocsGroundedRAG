# Add discounts

Learn how to apply discounts with coupons and promotion codes in your custom integration.

You can use discounts with the Checkout Sessions API to reduce the amount charged to a customer. Coupons and promotion codes allow you to:

- Apply a discount to an entire purchase subtotal
- Apply a discount to specific products
- Reduce the total charged by a percentage or a flat amount
- Create customer-facing promotion codes on top of coupons to share directly with customers

> #### Payment Intents API
> 
> If you use the Payment Intents API, you can apply discounts by calculating the discounted amount server-side, and creating or updating the PaymentIntent with the adjusted amount.

## Create a coupon

Coupons specify a fixed value discount. You can create customer-facing promotion codes that map to a single underlying coupon. This means that the codes `FALLPROMO` and `SPRINGPROMO` can both point to one 25% off coupon. You can create coupons in the [Dashboard](https://dashboard.stripe.com/coupons) or with the [API](https://docs.stripe.com/api.md#coupons):

```curl
curl https://api.stripe.com/v1/coupons \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d percent_off=20 \
  -d duration=once
```

## Use a coupon

To create a session with an applied discount, pass the [coupon ID](https://docs.stripe.com/api/coupons/object.md#coupon_object-id) in the `coupon` parameter of the [discounts](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-discounts) array. Checkout Sessions support up to one coupon or promotion code.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d "discounts[0][coupon]={{COUPON_ID}}" \
  -d mode=payment \
  -d ui_mode=elements \
  --data-urlencode "return_url=https://example.com/checkout/return"
```

## Configure a coupon

Coupons have the following parameters that you can use:

- `currency`
- `percent_off` or `amount_off`
- `max_redemptions`
- `redeem_by`: The latest date customers can apply the coupon
- `applies_to`: Limits the products that the coupon applies to

### Limit redemption usage

The `max_redemptions` and `redeem_by` values apply to the coupon across every application. For example, you can restrict a coupon to the first 50 usages of it, or you can make a coupon expire by a certain date.

### Limit eligible products

You can limit the products that are eligible for discounts using a coupon by adding the product IDs to the `applies_to` hash in the `Coupon` object. Any promotion codes that map to this coupon only apply to the list of eligible products.

### Delete a coupon

You can delete coupons in the Dashboard or the API. Deleting a coupon prevents it from being applied to future transactions or customers.

## Create a promotion code

Promotion codes are customer-facing codes created on top of coupons. You can also specify additional restrictions that control when a customer can apply the promotion. You can share these codes with customers who can enter them during checkout to apply a discount.

To create a [promotion code](https://docs.stripe.com/api/promotion_codes.md), specify an existing `coupon` and any restrictions (for example, limiting it to a specific [customer](https://docs.stripe.com/api/promotion_codes/object.md#promotion_code_object-customer) or [customer_account](https://docs.stripe.com/api/promotion_codes/object.md#promotion_code_object-customer_account)). If you have a specific code to give to your customer (for example, `FALL25OFF`), set the `code`. If you leave this field blank, we’ll generate a random `code` for you.

The `code` is case-insensitive and unique across active promotion codes for any customer. For example:

- You can create multiple customer-restricted promotion codes with the same `code`, but you can’t reuse that `code` for a promotion code redeemable by any customer.
- If you create a promotion code that is redeemable by any customer, you can’t create another active promotion code with the same `code`.
- You can create a promotion code with `code: NEWUSER`, inactivate it by passing `active: false`, and then create a new promotion code with `code: NEWUSER`.

Promotion codes can be created in the coupons section of the [Dashboard](https://dashboard.stripe.com/coupons/create) or with the [API](https://docs.stripe.com/api.md#promotion_codes):

```curl
curl https://api.stripe.com/v1/promotion_codes \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d coupon={{COUPON_ID}} \
  -d code=VIPCODE
```

## Use a promotion code 

On your server, enable customer-redeemable promotion codes using the [allow_promotion_codes](https://docs.stripe.com/api/checkout/sessions/object.md#checkout_session_object-allow_promotion_codes) parameter in a Checkout Session.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][unit_amount]=2000" \
  -d "line_items[0][price_data][product_data][name]=T-shirt" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d ui_mode=elements \
  -d allow_promotion_codes=true \
  --data-urlencode "return_url=https://example.com/checkout/return"
```

On your client, use [applyPromotionCode](https://docs.stripe.com/js/custom_checkout/apply_promotion_code) to apply a promotion code that your customer enters. Use [removePromotionCode](https://docs.stripe.com/js/custom_checkout/remove_promotion_code) to remove all previously applied promotion codes.

#### HTML + JS

```html
<input type="text" id="promotion-code" />
<button id="apply-promotion-code">Apply</button>
<button id="remove-promotion-codes">Remove</button>
<div id="promotion-code-error"></div>
```

```js
const checkout = stripe.initCheckoutElementsSdk({clientSecret});
const loadActionsResult = await checkout.loadActions();
if (loadActionsResult.type === 'success') {
  const {actions} = loadActionsResult;
  const input = document.getElementById('promotion-code');
  document.getElementById('apply-promotion-code').addEventListener('click', () => {
    actions.applyPromotionCode(input.value).then((result) => {
      if (result.error) {
        // Display an error message
        document.getElementById('promotion-code-error').textContent = result.error.message;
      } else {
        // Clear the input if the promotion code was successfully applied
        input.value = '';
      }
    });
  });
  document.getElementById('remove-promotion-codes').addEventListener('click', () => {
    actions.removePromotionCode();
  });
}
```

#### React

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const PromotionCode = () => {const checkoutState = useCheckout();
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
const {applyPromotionCode, removePromotionCode} = checkoutState.checkout;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  };
  const handleSubmit = () => {
    setLoading(true);applyPromotionCode(draft).finally(() => {
      setDraft('');
      setLoading(false);
    });
  };
  const handleRemove = () => {
    removePromotionCode();
  };

  return (
    <div>
      <input type="text" value={draft} onChange={handleChange} />
      <button disabled={loading} onClick={handleSubmit}>
        Apply
      </button>
      <button onClick={handleRemove}>Remove</button>
    </div>
  );
};

export default PromotionCode;
```

## Configure a promotion code

For each promotion code, you can customize eligible customers, redemptions, and other limits.

### Limit by customer

To limit a promotion to a particular customer, specify a [customer](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-customer) or [customer_account](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-customer_account) when creating the promotion code. If no customer is specified, any customer can redeem the code.

### Limit by first-time order

You can also limit the promotion code to first-time customers with [restrictions.first_time_transaction](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-restrictions-first_time_transaction). If a `customer` or `customer_account` isn’t defined, or if a defined `customer` or `customer_account` has no prior payments or non-void *invoices* (Invoices are statements of amounts owed by a customer. They track the status of payments from draft through paid or otherwise finalized. Subscriptions automatically generate invoices, or you can manually create a one-off invoice), it’s considered a first-time transaction.

> Sessions that don’t create a customer create a [guest customer](https://docs.stripe.com/payments/checkout/guest-customers.md) in the Dashboard instead. Promotion codes limited to first-time customers are still accepted for these Sessions.

### Set a minimum amount

With promotion codes, you can set a minimum transaction amount for eligible discount by configuring [minimum_amount](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-restrictions-minimum_amount) and [minimum_amount_currency](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-restrictions-minimum_amount_currency). Since promotion code restrictions are checked at redemption time, the minimum transaction amount only applies to the initial payment for a subscription.

### Customize expirations

You can set an expiration date on the promotion code using [expires_at](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-expires_at). If the underlying coupon already has `redeem_by` set, then the expiration date for the promotion code can’t be later than that of the coupon. If `promotion_code[expires_at]` isn’t specified, the coupon’s `redeem_by` automatically populates `expires_at`.

For example, you might have plans to support a coupon for a year, but you only want it to be redeemable for one week after a customer receives it. You can set `coupon[redeem_by]` to one year from now, and set each `promotion_code[expires_at]` to one week after it’s created.

### Limit redemptions

You can limit the number of redemptions by using [max_redemptions](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-max_redemptions), which works similarly to the coupon parameter. If the underlying coupon already has `max_redemptions` set, then the `max_redemptions` for the promotion code can’t be greater than that of the coupon.

For example, you might want a seasonal sale coupon to be redeemable by the first 50 customers, but the winter promotion can only use 20 of those redemptions. In this scenario, you can set `coupon[max_redemptions]: 50` and `promotion_code[max_redemptions]: 20`.

### Inactive promotions

You can set whether a promotion code is currently redeemable by using the [active](https://docs.stripe.com/api/promotion_codes/create.md#create_promotion_code-active) parameter. However, if the underlying coupon for a promotion code becomes invalid, all of its promotion codes become permanently inactive. Similarly, if a promotion code reaches its `max_redemptions` or `expires_at`, it becomes permanently inactive. You can’t reactivate these promotion codes.

### Delete promotions

You can delete promotions in the Dashboard or the API. Deleting a promotion prevents it from being applied to future transactions or customers.
