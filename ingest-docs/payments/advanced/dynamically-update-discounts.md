# Dynamically update discounts

Learn how to apply and modify discount codes during checkout.

> #### Private preview
> 
> Dynamic discounts is in private preview. 

Learn how to dynamically add or remove discounts on a [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md).

### Use cases 

This guide demonstrates how to integrate with your internal discounts system to create dynamic amount-off discounts, but you can also:

- **Apply loyalty discounts**: Automatically apply discounts based on customer loyalty tier or purchase history.
- **Cart value promotions**: Add discounts when the order total exceeds specific thresholds (for example, 10 USD off orders over 100 USD).
- **Time-sensitive offers**: Apply limited-time promotional discounts or remove expired discount codes.
- **Location-based discounts**: Apply region-specific discounts based on the customer’s shipping address.
- **Customer-specific offers**: Create personalized discount amounts based on customer segments or previous purchase behavior.

> #### Payment Intents API
> 
> If you use the Payment Intents API, you can apply discounts by manually calculating and modifying the payment amount, or by creating a new PaymentIntent with adjusted amounts.

## Set up the SDK [Server-side]

Use our official libraries to access the Stripe API from your application:

#### Ruby

```bash
gem install stripe -v 15.1.0-beta.2
```

## Update the server SDK [Server-side]

To use this preview feature, first update your SDK to use the `checkout_server_update_beta=v1` beta version header.

#### Ruby

```ruby

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
# Find your keys at https://dashboard.stripe.com/apikeys.
client = Stripe::StripeClient.new(
  '<<YOUR_SECRET_KEY>>',
  stripe_version: '2025-03-31.basil; checkout_server_update_beta=v1;',
)
```

## Configure update permissions for the Checkout Session [Server-side]

When you create the Checkout Session, pass the [permissions.update_discounts=server_only](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-permissions-update_discounts) option to disable applying client-side discounts and to enable updating discounts from your server.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -H "Stripe-Version: 2025-03-31.basil; checkout_server_update_beta=v1;" \
  -d ui_mode=elements \
  -d "permissions[update_discounts]=server_only" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  --data-urlencode "return_url=https://example.com/return"
```

## Dynamically update discounts [Server-side]

Create an endpoint on your server to apply discounts on the Checkout Session. You’ll call this from the front end in a later step.

> Client-side code runs in an environment that’s controlled by the user. A malicious user can bypass your client-side validation, intercept and modify requests, or create new requests to your server.

When creating an endpoint, we recommend the following:

- Create endpoints for specific customer interactions instead of making them generic. For example, “apply loyalty discount” instead of a general “update” action. Specific endpoints can help with writing and maintaining validation logic.
- Don’t pass [session data](https://docs.stripe.com/js/custom_checkout/session_object) directly from the client to your endpoint. Malicious clients can modify request data, making it an unreliable source for determining the Checkout Session state. Instead, pass the [session ID](https://docs.stripe.com/js/custom_checkout/session_object#custom_checkout_session_object-id) to your server and use it to securely retrieve the data from the Stripe API.

#### Ruby

```ruby
require 'sinatra'
require 'json'
require 'stripe'

set :port, 4242

# Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.
client = Stripe::StripeClient.new('<<YOUR_SECRET_KEY>>')

# Return a boolean indicating whether the discounts are valid.
def validate_discounts(discounts, session
  # Basic validation - ensure we only have one discount if any
  return true if discounts.empty? || discounts == ""

  # Ensure only one discount is being applied
  return false if discounts.is_a?(Array) && discounts.length > 1

  # Add your own validation logic here
  # For example, validate promo codes against your internal system
  true
end

# Return an array of the updated discounts or the original ones if no update is needed.
def recompute_discounts(discounts, session)
  # If removing discounts, return empty
  return [] if discounts.empty? || discounts == ""

  # Example: Access your internal discounts system
  # This could be based on customer ID, promo codes, cart value, and so on
  customer_id = session.customer || session.client_reference_id
  cart_total = session.amount_total

  # Example internal discount calculation
  discount_amount = calculate_customer_discount(customer_id, cart_total)

  if discount_amount > 0
    # Create a dynamic discount using coupon_data
    [{
      coupon_data: {
        name: "Customer Discount",
        amount_off: discount_amount,
        currency: session.currency || 'usd'
      }
    }]
  else
    # No discount applicable
    []
  end
end

# Example function to integrate with your internal discounts system
def calculate_customer_discount(customer_id, cart_total)
  # Example logic - replace with your actual discount system
  # This could check:
  # - Customer loyalty tier
  # - Active promotions
  # - Cart value thresholds
  # - Seasonal discounts

  # Example: 10% off for carts over 100 USD, max 20 USD discount
  if cart_total > 10000  # 100 USD in cents
    discount = [cart_total * 0.1, 2000].min  # Max 20 USD discount
    discount.to_i
  else
    0
  end
end

post '/update-discounts' do
  content_type :json
  request.body.rewind
  request_data = JSON.parse(request.body.read)

  checkout_session_id = request_data['checkout_session_id']
  discounts = request_data['discounts']

  # 1. Retrieve the Checkout Session
  session = client.v1.checkout.sessions.retrieve(checkout_session_id)

  # 2. Validate the discounts
  if !validate_discounts(discounts, session)
    return { type: 'error', message: 'Your discounts are invalid. Please refresh your session.' }.to_json
  end

  # 3. Recompute the discounts with your custom logic
  discounts = recompute_discounts(discounts, session)

  # 4. Update the Checkout Session with the new discounts
  if discounts
    client.v1.checkout.sessions.update(checkout_session_id, {
      discounts: discounts,
    })

    return { type: 'object', value: { succeeded: true } }.to_json
  else
    return { type: 'error', message: "We could not update your discounts. Please try again." }.to_json
  end
end
```

## Update the client SDK [Client-side]

#### HTML + JS

Initialize Stripe.js with the `custom_checkout_server_updates_1` beta header.

```javascript
const stripe = Stripe('<<YOUR_PUBLISHABLE_KEY>>', {
  betas: ['custom_checkout_server_updates_1'],
});
```

#### React

Pass the `custom_checkout_server_updates_1` beta header when initializing the `stripe` instance.

```javascript
import {loadStripe} from '@stripe/stripe-js';
const stripe = loadStripe("<<YOUR_PUBLISHABLE_KEY>>", {
  betas: ['custom_checkout_server_updates_1'],
});
```

## Request server updates [Client-side]

#### HTML + JS

From your front end, send an update request to your server and wrap it in [runServerUpdate](https://docs.stripe.com/js/custom_checkout/run_server_update). A successful request updates the [Session](https://docs.stripe.com/js/custom_checkout/session_object) object with the new discount.

```html
<button id="apply-customer-discount">
  Apply Customer Discount
</button>
```

```javascript
document.getElementById('apply-customer-discount')
  .addEventListener("click", async (event) => {
    const updateCheckout = () => {
      return fetch("/apply-customer-discount", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify({
          checkout_session_id: actions.getSession().id,
        })
      });
    };
const response = await checkout.runServerUpdate(updateCheckout);
    if (!response.ok) {
      // Handle error state
      return;
    }

    // Update UI to reflect the applied discount
    event.target.textContent = "Discount Applied!";
    event.target.disabled = true;
  });

```

#### React

From your front end, send an update request to your server and wrap it in [runServerUpdate](https://docs.stripe.com/js/custom_checkout/run_server_update). A successful request updates the [Session](https://docs.stripe.com/js/custom_checkout/session_object) object with the new discount.

```jsx
import React from 'react';
import {useCheckout} from '@stripe/react-stripe-js/checkout';

const ApplyDiscountButton = () => {
  const [isDiscountApplied, setIsDiscountApplied] = React.useState(false);
  const checkoutState = useCheckout();

  if (checkoutState.type === 'loading') {
    return (
      <div>Loading...</div>
    );
  } else if (checkoutState.type === 'error') {
    return (
      <div>Error: {checkoutState.error.message}</div>
    );
  }
  const {runServerUpdate, id} = checkoutState.checkout;

  const updateCheckout = () =>
    fetch("/apply-customer-discount", {
      method: "POST",
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        checkout_session_id: id,
      })
    });

  const handleClick = async () => {const response = await runServerUpdate(updateCheckout);
    if (!response.ok) {
      // set error state
      return;
    }

    // Update UI to reflect the applied discount
    setIsDiscountApplied(true);
  };

  return (
    <button onClick={handleClick} disabled={isDiscountApplied}>
      {isDiscountApplied
        ? "Discount Applied!"
        : "Apply Customer Discount"}
    </button>
  );
};
```

## Test the integration

Follow these steps to test your integration, and ensure your dynamic discounts work correctly.

1. Set up a sandbox environment that mirrors your production setup. Use your Stripe sandbox API keys for this environment.

1. Simulate various discount scenarios to verify that your `recomputeDiscounts` function handles different scenarios correctly.

1. Verify server-side logic by using logging or debugging tools to confirm that your server:

   - Retrieves the [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md).
   - Validates discount requests.
   - Recomputes updated discounts based on your business logic.
   - Updates the [Checkout Session](https://docs.stripe.com/api/checkout/sessions/object.md) with the new discounts when your custom conditions are met. Make sure the update response contains the new discounts. By default, the response doesn’t contain the discounts field, unless the request [expands](https://docs.stripe.com/api/expanding_objects.md) the object.

1. Verify client-side logic by completing the checkout process multiple times in your browser. Pay attention to how the UI updates after applying a discount. Make sure that:

   - The [runServerUpdate](https://docs.stripe.com/js/custom_checkout/run_server_update) function is called as expected.
   - Discounts apply correctly based on your business logic.
   - The checkout total updates to reflect the applied discount.
   - Error messages display properly when a discount application failed.

1. Test various discount scenarios including invalid discount requests or simulate server errors to test error handling, both server-side and client-side.
