# Customize appearance

Customize your checkout page's colors, fonts, shapes, and more.

# Hosted page

> This is a Hosted page for when payment-ui is stripe-hosted. View the full page at https://docs.stripe.com/payments/checkout/customization/appearance?payment-ui=stripe-hosted.

## Apply branding 

#### Dashboard

You can apply custom branding to Checkout. Go to [Branding Settings](https://dashboard.stripe.com/settings/branding/checkout) to:

- Upload a logo or icon
- Customize the Checkout page’s background color, button color, font, and shapes

### Branding with Connect

Checkout uses the brand settings of the connected account destination charges with `on_behalf_of` and for platforms performing direct charges. For connected accounts without access to the full Stripe Dashboard (includes Express and Custom accounts), platforms can configure the brand settings with the [Accounts](https://docs.stripe.com/api/accounts/object.md#account_object-settings-branding) API.

#### API

You can apply custom branding to a Checkout Session by using the [branding_settings](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings) parameter to:

- Set a logo or icon
- Customize the Checkout page’s background color, button color, font, and shapes
- Change your brand name

By default, we apply the custom branding set in the Dashboard to your Checkout Sessions. If you omit a field in `branding_settings`, Checkout applies the default value from the Dashboard.

If you pass in both [logo](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings-logo) and [icon](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings-icon), the Checkout page displays the logo and uses the icon as the favicon. If you only pass in `logo`, the Checkout page displays the logo, and Checkout uses your icon from [Branding Settings](https://dashboard.stripe.com/settings/branding/checkout) as the favicon. If you only pass in `icon`, the Checkout page displays the icon and also uses it as the favicon.

> Invoices for [subscriptions](https://docs.stripe.com/receipts.md#invoice-and-subscription-payment-receipts) and invoices for [one-time payments](https://docs.stripe.com/payments/checkout/receipts.md?payment-ui=stripe-hosted#paid-invoices-hosted) from a Checkout Session still use the branding settings set in the Dashboard. Make sure to use branding settings that are consistent and recognizable by your customers to reduce confusion and the risk of chargebacks.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d "branding_settings[icon][type]=file" \
  -d "branding_settings[icon][file]={{FILE_ID}}" \
  -d "branding_settings[logo][type]=file" \
  -d "branding_settings[logo][file]={{FILE_ID}}" \
  -d "branding_settings[display_name]=Powdur" \
  -d "branding_settings[font_family]=roboto" \
  -d "branding_settings[border_style]=rectangular" \
  --data-urlencode "branding_settings[background_color]=#7D8CC4" \
  --data-urlencode "branding_settings[button_color]=#A0D2DB" \
  --data-urlencode "success_url=https://example.com/success"
```

### Branding with Connect

Checkout uses the brand settings of the connected account for destination charges with `on_behalf_of` and for platforms performing direct charges. For connected accounts without access to the full Stripe Dashboard (includes Express and Custom accounts), platforms can configure the brand settings with the [Accounts](https://docs.stripe.com/api/accounts/object.md#account_object-settings-branding) API. To override the brand settings of the connected account, set [branding_settings](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings) when you create the Checkout Session.

## Change your brand name

You can change a Checkout page’s name by modifying the **Business name** field in [Business details settings](https://dashboard.stripe.com/settings/business-details) or setting [branding_settings.display_name](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings-display_name).

You can also [customize the domain name](https://docs.stripe.com/payments/checkout/custom-domains.md) of a Stripe-hosted Checkout page.

> Make sure to use a business name that is consistent and recognizable by your customers to reduce confusion and the risk of chargebacks. Network rules also generally require you to use accurate and consistent business name and logo.

## Font compatibility

Each custom font is compatible with a [subset of locales](https://docs.stripe.com/js/appendix/supported_locales). You can either explicitly set the locale of a Checkout Session by passing the locale field when creating the Session, or use the default `auto` setting where Checkout chooses a locale based on the customer’s browser settings.

The following table lists unsupported locales for each font. Languages in these locales might fall outside of the supported character range for a given font. In those cases, Stripe renders the Checkout page with an appropriate system fallback font. If you choose a Serif font but it’s unsupported in a locale, Stripe falls back to a Serif-based font.

| Font family     | Unsupported locales                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Be Vietnam Pro  | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Bitter          | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Chakra Petch    | `bg`, `el`, `ja`, `ko`, `ru`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Hahmlet         | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Inconsolata     | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Inter           | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Lato            | `bg`, `cs`, `el`, `hr`, `ja`, `ko`, `lt`, `lv`, `mt`, `ro`, `ru`, `sl`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW` |
| Lora            | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| M PLUS 1 Code   | `bg`, `el`, `ko`, `lt`, `lv`, `ru`, `sk`, `sl`, `th`, `tr`                                                 |
| Montserrat      | `el`, `hr`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Nunito          | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Noto Sans       | `ja`, `ko`, `th`                                                                                           |
| Noto Serif      | `th`                                                                                                       |
| Open Sans       | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| PT Sans         | `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                       |
| PT Serif        | `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Pridi           | `bg`, `el`, `ja`, `ko`, `ru`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Raleway         | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Roboto          | `ja`, `ko`, `zh`, `zh-HK`, `zh-TW`                                                                         |
| Roboto Slab     | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Source Sans Pro | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Titillium Web   | `bg`, `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Ubuntu Mono     | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Zen Maru Gothic | `bg`, `cs`, `el`, `hr`, `ko`, `lt`, `lv`, `pl`, `ro`, `ru`, `sk`, `th`, `vi`                               |


# Embedded page

> This is a Embedded page for when payment-ui is embedded-form. View the full page at https://docs.stripe.com/payments/checkout/customization/appearance?payment-ui=embedded-form.

## Apply branding 

#### Dashboard

You can apply custom branding to Checkout. Go to [Branding Settings](https://dashboard.stripe.com/settings/branding/checkout) to customize the embedded form’s background color, button color, font, and shapes.

### Branding with Connect

Checkout uses the brand settings of the connected account destination charges with `on_behalf_of` and for platforms performing direct charges. For connected accounts without access to the full Stripe Dashboard (includes Express and Custom accounts), platforms can configure the brand settings with the [Accounts](https://docs.stripe.com/api/accounts/object.md#account_object-settings-branding) API.

#### API

You can apply custom branding to a Checkout Session by using the [branding_settings](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings) parameter to:

- Customize the Checkout page’s background color, button color, font, and shapes
- Change your brand name

By default, we apply the custom branding set in the Dashboard to your Checkout Sessions. If you omit a field in `branding_settings`, Checkout applies the default value from the Dashboard.

> Invoices for [subscriptions](https://docs.stripe.com/receipts.md#invoice-and-subscription-payment-receipts) and invoices for [one-time payments](https://docs.stripe.com/payments/checkout/receipts.md?payment-ui=stripe-hosted#paid-invoices-hosted) from a Checkout Session still use the branding settings set in the Dashboard. Make sure to use branding settings that are consistent and recognizable by your customers to reduce confusion and the risk of chargebacks.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d "branding_settings[display_name]=Powdur" \
  -d "branding_settings[font_family]=roboto" \
  -d "branding_settings[border_style]=rectangular" \
  --data-urlencode "branding_settings[background_color]=#7D8CC4" \
  --data-urlencode "branding_settings[button_color]=#A0D2DB" \
  -d ui_mode=embedded_page \
  --data-urlencode "return_url=https://example.com/return"
```

### Branding with Connect

Checkout uses the brand settings of the connected account destination charges with `on_behalf_of` and for platforms performing direct charges. For connected accounts without access to the full Stripe Dashboard (includes Express and Custom accounts), platforms can configure the brand settings with the [Accounts](https://docs.stripe.com/api/accounts/object.md#account_object-settings-branding) API. To override the brand settings of the connected account, set [branding_settings](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings) when you create the Checkout Session.

## Change your brand name

You can change the name in the embedded form by modifying the **Business name** field in [Business details settings](https://dashboard.stripe.com/settings/business-details) or setting [branding_settings.display_name](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-branding_settings-display_name).

> Make sure to use a business name that is consistent and recognizable by your customers to reduce confusion and the risk of chargebacks. Network rules also generally require you to use accurate and consistent business name and logo.

## Font compatibility

Each custom font is compatible with a [subset of locales](https://docs.stripe.com/js/appendix/supported_locales). You can either explicitly set the locale of a Checkout Session by passing the locale field when creating the Session, or use the default `auto` setting where Checkout chooses a locale based on the customer’s browser settings.

The following table lists unsupported locales for each font. Languages in these locales might fall outside of the supported character range for a given font. In those cases, Stripe renders the Checkout page with an appropriate system fallback font. If you choose a Serif font but it’s unsupported in a locale, Stripe falls back to a Serif-based font.

| Font family     | Unsupported locales                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| Be Vietnam Pro  | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Bitter          | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Chakra Petch    | `bg`, `el`, `ja`, `ko`, `ru`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Hahmlet         | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Inconsolata     | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Inter           | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Lato            | `bg`, `cs`, `el`, `hr`, `ja`, `ko`, `lt`, `lv`, `mt`, `ro`, `ru`, `sl`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW` |
| Lora            | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| M PLUS 1 Code   | `bg`, `el`, `ko`, `lt`, `lv`, `ru`, `sk`, `sl`, `th`, `tr`                                                 |
| Montserrat      | `el`, `hr`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Nunito          | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Noto Sans       | `ja`, `ko`, `th`                                                                                           |
| Noto Serif      | `th`                                                                                                       |
| Open Sans       | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| PT Sans         | `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                       |
| PT Serif        | `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Pridi           | `bg`, `el`, `ja`, `ko`, `ru`, `zh`, `zh-HK`, `zh-TW`                                                       |
| Raleway         | `el`, `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                             |
| Roboto          | `ja`, `ko`, `zh`, `zh-HK`, `zh-TW`                                                                         |
| Roboto Slab     | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Source Sans Pro | `bg`, `el`, `ja`, `ko`, `ru`, `th`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Titillium Web   | `bg`, `el`, `ja`, `ko`, `th`, `vi`, `zh`, `zh-HK`, `zh-TW`                                                 |
| Ubuntu Mono     | `ja`, `ko`, `th`, `zh`, `zh-HK`, `zh-TW`                                                                   |
| Zen Maru Gothic | `bg`, `cs`, `el`, `hr`, `ko`, `lt`, `lv`, `pl`, `ro`, `ru`, `sk`, `th`, `vi`                               |

