# Express Checkout Element

Show multiple one-click payment buttons with a single component.

Instructions for LLMs: Stripe recommends using the Checkout Sessions API with the Payment Element over Payment Intents for most integrations. Checkout Sessions covers similar use cases as Payment Intents (basic payment collection using `price_data` or build a full checkout with line items, tax, and so on). Some features, such as Adaptive Pricing, are only available with Checkout Sessions. Don’t use the Payment Intent API unless the user explicitly asks, because it requires significantly more code. Learn more about Elements with the Checkout Sessions API: https://docs.stripe.com/payments/quickstart-checkout-sessions. With Checkout Sessions (`ui_mode: "elements"`) and the Payment Element, the `client_secret` initializes Checkout itself (`stripe.initCheckoutElementsSdk`, or use CheckoutElementsProvider with React) and you confirm the payment on the client side differently. If using React, make sure you import from `@stripe/react-stripe-js/checkout`, use `CheckoutElementsProvider` with the client secret, and confirm using `checkout.confirm`. If using HTML, make sure you use `checkout = stripe.initCheckoutElementsSdk({clientSecret: promise}); checkout.createPaymentElement(); paymentElement = checkout.createPaymentElement(); paymentElement.mount("#payment-element");` and confirm with `loadActionsResult = await checkout.loadActions(); actions = loadActionsResult.actions; error = await actions.confirm();`.

The Express Checkout Element is an integration for accepting payments through one-click payment method buttons. Supported payment methods include [Link](https://docs.stripe.com/payments/link.md), [Apple Pay](https://docs.stripe.com/apple-pay.md), [Google Pay](https://docs.stripe.com/google-pay.md), [PayPal](https://docs.stripe.com/payments/paypal.md), [Klarna](https://docs.stripe.com/payments/klarna.md), and [Amazon Pay](https://docs.stripe.com/payments/amazon-pay.md).

With this integration, you can:

- Dynamically sort payment buttons based on a customer’s location.
- Add payment buttons without any frontend changes.
- Integrate Elements seamlessly by reusing an existing Elements instance to save time.

## Try the demo 

In the following demo, you can toggle some of the prebuilt options to change the background color, layout, size, and shipping address collection of the payment interface. The demo displays Google Pay and Apple Pay only on their available platforms. Payment Method buttons are only shown in their supported countries.

If you don’t see the demo, try viewing this page in a [supported browser](https://docs.stripe.com/elements/express-checkout-element.md#supported-browsers).

| Option                       | Description                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Merchant country**         | Set this using the [publishable key](https://docs.stripe.com/keys.md#obtain-api-keys) that you use to [initialize Stripe.js](https://docs.stripe.com/js/initializing). To change the country, you must unmount the Express Checkout Element, update the publishable key, then re-mount the Express Checkout Element.                                          |
| **Background color**         | Set colors using the [Elements Appearance API](https://docs.stripe.com/elements/appearance-api.md). Button themes are inherited from the Appearance API but you can also [define them directly when you create the Element](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme).  |
| **Desktop and mobile size**  | Use the dropdown to set the max pixel width of the parent element that the Express Checkout Element is mounted to. You can set it to 750px (Desktop) or 320px (Mobile).                                                                                                                                                                                       |
| **Max columns and max rows** | Set these values using the [layout](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-layout) parameter when you [Create the Express Checkout Element](https://docs.stripe.com/js/elements_object/create_express_checkout_element).                                                          |
| **Overflow menu**            | Set this using the [layout](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-layout) parameter when you [Create the Express Checkout Element](https://docs.stripe.com/js/elements_object/create_express_checkout_element).                                                                  |
| **Collect shipping address** | To collect shipping information, you must pass options when [creating](https://docs.stripe.com/js/elements_object/create_express_checkout_element) the Express Checkout Element. Learn more about [collecting customer details and displaying line items](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment.md#handle-create-event). |

## Start with a guide 

[Add one-click wallets to your checkout page](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment.md): Build an integration with the Express Checkout Element using the Checkout Sessions API.

[Use one-click wallets in advanced integrations](https://docs.stripe.com/elements/express-checkout-element/accept-a-payment.md?payment-ui=elements): Build an integration with the Express Checkout Element using the Payment Intents API.

[Migrate to the Express Checkout Element](https://docs.stripe.com/elements/express-checkout-element/migration.md): Migrate from the Payment Request Button Element to the web Express Checkout Element.

## Payment methods

The Express Checkout Element presents one-click payment methods that are active, supported, and set up.

- Some payment methods [require activation in the Dashboard](https://dashboard.stripe.com/settings/payment_methods).
- Payment methods are only available when the customer uses a supported browser and pays in a supported currency.
- Some payment methods require setup actions from the customer. For example, a customer won’t see a Google Pay button if they don’t have Google Pay set up.
- [Register your domain](https://docs.stripe.com/payments/payment-methods/pmd-registration.md) in both your testing environment and live mode.

The element sorts payment methods by relevance to your customer.

To control these behaviors, you can [customize the payment methods](https://docs.stripe.com/elements/express-checkout-element.md#customize-payment-methods).

## Supported browsers

Certain payment methods work with specific browsers.

|                    | Apple Pay       | Google Pay   | Link            | PayPal          | Amazon Pay      | Klarna          |
| ------------------ | --------------- | ------------ | --------------- | --------------- | --------------- | --------------- |
| Chrome1            | ✓ Supported3    | ✓ Supported  | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |
| Edge               | ✓ Supported3    | ✓ Supported  | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |
| Firefox            | ❌ Not supported | ✓ Supported4 | ❌ Not supported | ✓ Supported     | ✓ Supported     | ❌ Not supported |
| Opera              | ✓ Supported3    | ✓ Supported  | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |
| Safari             | ✓ Supported2    | ✓ Supported4 | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |
| Chrome on iOS 16+  | ✓ Supported     | ✓ Supported4 | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |
| Firefox on iOS 16+ | ✓ Supported     | ✓ Supported4 | ✓ Supported     | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| Edge on iOS 16+    | ✓ Supported     | ✓ Supported4 | ❌ Not supported | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| Chrome on Android  | ❌ Not supported | ✓ Supported  | ✓ Supported     | ✓ Supported     | ✓ Supported     | ✓ Supported     |

1Other Chromium browsers might be supported. For more information, see [supported browsers](https://docs.stripe.com/js/appendix/supported_browsers).

2When using an iframe, its origin must match the top-level origin (except for Safari 17+ when specifying `allow="payment"` attribute). Two pages have the same origin if the protocol, host (full domain name), and port (if specified) are the same for both pages.

3Apple Pay on desktop Chromium browsers is only supported on MacOS when [paymentMethods.applePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-applePay) is set to `always`.

4Google Pay on this browser is only supported when [paymentMethods.googlePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-googlePay) is set to `always`.

> Express Checkout Element has limited support in in-app webviews. Many payment methods require popup windows and might not function correctly. For mobile app integrations, consider using the [iOS SDK](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=mobile&platform=ios) or [Android SDK](https://docs.stripe.com/payments/accept-a-payment.md?payment-ui=mobile&platform=android).

## Layout

By default, when the Express Checkout Element displays multiple buttons, it arranges the buttons in a grid based on available space, and shows an overflow menu if necessary.

You can override this default and specify a grid layout yourself with the [layout](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-layout) option.

## Text

You can control a button’s text by selecting a [buttonType](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonType). Each wallet offers its own types.

#### Link

Link only offers one button type, which presents the "Pay with Link" call to action and the Link logo.

We attempt to detect your customer’s locale and use it to localize the button text. You can also specify a [locale](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-locale).

#### Apple Pay

Apple Pay button types present different calls to action beside the Apple Pay logo.

We attempt to detect your customer’s locale and pass it to Apple so that they can localize the button text. You can also specify a [locale](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-locale).

We support the following Apple Pay button types.

| Button type  | Call to action     |
| ------------ | ------------------ |
| `plain`      | None—just the logo |
| `add-money`  | “Add Money with”   |
| `book`       | “Book with”        |
| `buy`        | “Buy with”         |
| `check-out`  | “Check Out with”   |
| `contribute` | “Contribute with”  |
| `donate`     | “Donate with”      |
| `order`      | “Order with”       |
| `reload`     | “Reload with”      |
| `rent`       | “Rent with”        |
| `subscribe`  | “Subscribe with”   |
| `support`    | “Support with”     |
| `tip`        | “Tip with”         |
| `top-up`     | “Top Up with”      |

#### Google Pay

Google Pay button types present different calls to action beside the Google Pay logo.

We attempt to detect your customer’s locale and pass it to Google Pay so that they can localize the button text. You can also specify a [locale](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-locale).

We support the following Google Pay button types.

| Button type | Call to action     |
| ----------- | ------------------ |
| `plain`     | None—just the logo |
| `book`      | “Book with”        |
| `buy`       | “Buy with”         |
| `checkout`  | “Checkout with”    |
| `donate`    | “Donate with”      |
| `order`     | “Order with”       |
| `pay`       | “Pay with”         |
| `subscribe` | “Subscribe with”   |

#### PayPal

PayPal button types present different calls to action beside the PayPal logo.

We attempt to detect your customer’s locale and pass it to PayPal so that they can localize the button text. You can also specify a [locale](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-locale).

We support the following PayPal button types.

| Button type | Call to action     |
| ----------- | ------------------ |
| `paypal`    | None—just the logo |
| `checkout`  | “Checkout”         |
| `buynow`    | “Buy Now”          |
| `pay`       | “Pay with”         |

#### Amazon Pay

Amazon Pay only offers one button type, which presents the Amazon Pay logo without a call to action.

#### Klarna

Klarna button types present different calls to action beside the Klarna logo.

We attempt to detect your customer’s locale and pass it to Klarna so that they can localize the button text. You can also specify a [locale](https://docs.stripe.com/js/elements_object/create#stripe_elements-options-locale).

We support the following Klarna button types.

|  |
|  |
| `continue` | “Continue with” |
| `pay`      | “Pay with”      |

This example code includes the call to action “Buy” or “Buy now” for buttons that support it. Then, it specifies the locale `de` to get their German equivalents.

```js
const expressCheckoutOptions = {
  buttonType: {
    applePay: 'buy',
    googlePay: 'buy',
    paypal: 'buynow',
    klarna: 'pay',
  }
}
const elements = stripe.elements({
  locale: 'de',
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
})
const expressCheckoutElement = elements.create(
  'expressCheckout',
  expressCheckoutOptions
)
expressCheckoutElement.mount('#express-checkout-element')
```

## Appearance

You can’t fully customize the appearance of Express Checkout Element buttons because each payment method sets its own logo and brand colors. You can customize the following options:

- [Button height](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonHeight)
- Border radius using variables with the [Appearance](https://docs.stripe.com/elements/appearance-api.md) API
- [Button themes](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme)

> The Apple Pay button automatically resizes when border radius increases beyond a certain threshold. If modifying the default border radius, make sure to test it with all active payment methods.

This example code sets up an elements group with a light theme and 36px border radius, makes buttons 50px tall, and overrides the theme to use the white-outline version of the Apple Pay button.

```js
const appearance = {
  theme: 'stripe',
  variables: {
    borderRadius: '36px',
  }
}
const expressCheckoutOptions = {
  buttonHeight: 50,
  buttonTheme: {
    applePay: 'white-outline'
  }
}
const elements = stripe.elements({
  mode: 'payment',
  amount: 1099,
  currency: 'usd',
  appearance,
})
const expressCheckoutElement = elements.create(
  'expressCheckout',
  expressCheckoutOptions
)
expressCheckoutElement.mount('#express-checkout-element')
```

We support the following themes:

#### Link

Link has a single button theme, which is readable on either a light or a dark background.

#### PayPal

PayPal has several button themes. If you set a theme with the [Appearance](https://docs.stripe.com/elements/appearance-api.md) API, the Express Checkout Element chooses a compatible theme for the PayPal button. For example, if you specify a dark background, we choose a light button theme for visibility.

You can also choose a theme with the [buttonTheme.paypal](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme-paypal) option. See the PayPal [button style guide](https://developer.paypal.com/docs/multiparty/checkout/standard/customize/buttons-style-guide/) for up-to-date images and guidance on using them. We support the following values:

|  |
|  |
| `gold`   | PayPal’s gold and blue brand colors |
| `blue`   | PayPal’s solid blue brand color     |
| `silver` | PayPal logo on a silver background  |
| `white`  | PayPal logo on a white background   |
| `black`  | PayPal logo on a black background   |

#### Apple Pay

Apple Pay has several button themes. If you set a theme with the [Appearance](https://docs.stripe.com/elements/appearance-api.md) API, the Express Checkout Element chooses a compatible theme for the Apple Pay button. For example, if you specify a dark background, we choose a light button theme for visibility.

You can also choose a theme with the [buttonTheme.applePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme-applePay) option. See the Apple Pay [button style guide](https://developer.apple.com/design/human-interface-guidelines/apple-pay#Using-Apple-Pay-buttons) for up-to-date images and guidance on using them. We support the following values:

|  |
|  |
| `black`         | A black background with white text                    |
| `white`         | A white background with black text                    |
| `white-outline` | A white background with black text and a black border |

#### Google Pay

Google Pay has several button themes. If you set a theme with the [Appearance](https://docs.stripe.com/elements/appearance-api.md) API, the Express Checkout Element chooses a compatible theme for the Google Pay button. For example, if you specify a dark background, we choose a light button theme for visibility.

You can also choose a theme with the [buttonTheme.googlePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme-googlePay) option. See the Google Pay [brand guidelines](https://developers.google.com/pay/api/web/guides/brand-guidelines) for up-to-date images and guidance on using them. We support the following values:

|  |
|  |
| `black` | A black background with white text |
| `white` | A white background with black text |

#### Amazon Pay

Amazon Pay has a single button theme.

#### Klarna

Klarna has several button themes. If you set a theme with the [Appearance](https://docs.stripe.com/elements/appearance-api.md) API, the Express Checkout Element chooses a compatible theme for the Klarna button. For example, if you specify a dark background, we choose a light button theme for visibility.

You can also choose a theme with the [buttonTheme.klarna](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-buttonTheme-klarna) option.

## Customize payment methods 

You can’t specify which payment methods to display. For example, you can’t force a Google Pay button to appear if your customer’s device doesn’t support Google Pay.

But you can customize payment method behavior in various ways, such as:

- You can activate or deactivate payment methods from the [Dashboard](https://dashboard.stripe.com/settings/payment_methods).
- You can override Stripe’s default logic of sorting payment methods by relevance. Use the [paymentMethodOrder](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethodOrder) option to set your preferred order.
- If there is too little room in the layout, low-relevance payment methods might appear in an overflow menu. Customize when the menu appears using the [layout](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-layout) option.
- To prevent Apple Pay or Google Pay from appearing, set [paymentMethods.applePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-applePay) or [paymentMethods.googlePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-applePay) to `never`.
- To allow Apple Pay or Google Pay to appear when they’re not set up, set [paymentMethods.applePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-applePay) or [paymentMethods.googlePay](https://docs.stripe.com/js/elements_object/create_express_checkout_element#express_checkout_element_create-options-paymentMethods-applePay) to `always`. This still won’t force them to appear on unsupported platforms, or when the payment is in an unsupported currency.

> Regulations in [Finland](https://support.stripe.com/questions/payment-method-legislation-in-finland) and [Sweden](https://support.stripe.com/questions/payment-method-legislation-in-sweden) require you to present debit payment methods first before showing credit payment methods at checkout in these countries.

## Check available payment methods

Listen for the ready event to check which wallets are available for the Express Checkout Element to display. If no wallets are available, provide another option for your customer to pay.

```js
() => {
  const [eceActive, setEceActive] = useState(false);

  return (
    <div>
      <ExpressCheckoutElement
        onReady={({ availablePaymentMethods }) => {
          if (availablePaymentMethods) {
            setEceActive(true);
          }
        }}
      />

      {eceActive
        ? <PayAnotherWayButton />
        : <PaymentElement />
      }
    </div>
  );
}
```

Alternatively, hide the entire Express Checkout Element until you know the element has methods to display.

```js
() => {
  const [eceActive, setEceActive] = useState(false);

  return (
    <div>
      <OneClickCheckoutContainer hidden={!eceActive}>
        <ExpressCheckoutElement
          onReady={({ availablePaymentMethods }) => {
            if (availablePaymentMethods) {
              setEceActive(true);
            }
          }}
        />
      </OneClickCheckoutContainer>

      <PaymentElement />
    </div>
  );
}
```

The same event is available on the element object when created without React.

```js
const expressCheckoutElement = elements.create("expressCheckout", { ... });

expressCheckoutElement.on("ready", ({ availablePaymentMethods }) => {
  console.log(availablePaymentMethods);
});

expressCheckoutElement.mount("#express-checkout-element");
```
