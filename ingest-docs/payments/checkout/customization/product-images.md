# Add product images

Provide a visual representation of what your customers are purchasing.

We recommend adding an image and description to your products to drive higher conversion. Your customers see the product image and description next to each line item in the checkout page.

# Hosted page

> This is a Hosted page for when payment-ui is stripe-hosted. View the full page at https://docs.stripe.com/payments/checkout/customization/product-images?payment-ui=stripe-hosted.

You can add images and descriptions through the Dashboard or the Checkout Sessions API.

#### Dashboard

To add an image when you create a product in the Dashboard:

1. Go to the [Products](https://dashboard.stripe.com/products?active=true) page.
1. Click  **+ Create product**.
1. Add a **Description**.
1. Click :upload: **Upload** in the **Image** section to upload an image.

To add an image or description to an existing product in the Dashboard:

1. Go to the [Products](https://dashboard.stripe.com/products?active=true) page.
1. Click the overflow menu (⋯) of a product and select **Edit**.
1. Add a **Description**.
1. Click :upload: **Upload** in the **Image** section to upload an image.

#### API

When you create products through the API, you can specify product images using the [images](https://docs.stripe.com/api/products/create.md#create_product-images) parameter. You can also add images inline when creating a Checkout Session with [product_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data).

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "name=Premium T-Shirt" \
  -d "description=Comfortable cotton t-shirt" \
  --data-urlencode "images[]=https://example.com/t-shirt.png" \
  -d "default_price_data[unit_amount]=1000" \
  -d "default_price_data[currency]=usd"
```

To [create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create.md) that references the product you created, specify the [price](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price) ID. Checkout automatically displays the image.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  --data-urlencode "success_url=https://example.com/success"
```

## Use inline product data

You can also specify images and create products directly on the Checkout Session by using the [product_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data) parameter. This can be useful when product data is dynamic or one-off.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][unit_amount]=1000" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Premium T-Shirt" \
  -d "line_items[0][price_data][product_data][description]=Comfortable cotton t-shirt" \
  --data-urlencode "line_items[0][price_data][product_data][images][0]=https://example.com/t-shirt.png" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  --data-urlencode "success_url=https://example.com/success"
```

## See also

- [Customize Checkout appearance](https://docs.stripe.com/payments/checkout/customization/appearance.md)
- [Products and prices](https://docs.stripe.com/products-prices/how-products-and-prices-work.md)
- [Product catalog](https://docs.stripe.com/payments/checkout/product-catalog.md)


# Embedded page

> This is a Embedded page for when payment-ui is embedded-form. View the full page at https://docs.stripe.com/payments/checkout/customization/product-images?payment-ui=embedded-form.

You can add images and descriptions through the Dashboard or the Checkout Sessions API.

#### Dashboard

To add an image when you create a product in the Dashboard:

1. Go to the [Products](https://dashboard.stripe.com/products?active=true) page.
1. Click  **+ Create product**.
1. Add a **Description**.
1. Click :upload: **Upload** in the **Image** section to upload an image.

To add an image or description to an existing product in the Dashboard:

1. Go to the [Products](https://dashboard.stripe.com/products?active=true) page.
1. Click the overflow menu (⋯) of a product and select **Edit**.
1. Add a **Description**.
1. Click :upload: **Upload** in the **Image** section to upload an image.

#### API

When you create products through the API, you can specify product images using the [images](https://docs.stripe.com/api/products/create.md#create_product-images) parameter. You can also add images inline when creating a Checkout Session with [product_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data).

```curl
curl https://api.stripe.com/v1/products \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "name=Premium T-Shirt" \
  -d "description=Comfortable cotton t-shirt" \
  --data-urlencode "images[]=https://example.com/t-shirt.png" \
  -d "default_price_data[unit_amount]=1000" \
  -d "default_price_data[currency]=usd"
```

To [create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create.md) that references the product you created, specify the [price](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price) ID. Checkout automatically displays the image.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price]={{PRICE_ID}}" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d ui_mode=embedded_page \
  --data-urlencode "return_url=https://example.com/return"
```

## Use inline product data

You can also specify images and create products directly on the Checkout Session by using the [product_data](https://docs.stripe.com/api/checkout/sessions/create.md#create_checkout_session-line_items-price_data-product_data) parameter. This can be useful when product data is dynamic or one-off.

```curl
curl https://api.stripe.com/v1/checkout/sessions \
  -u "<<YOUR_SECRET_KEY>>:" \
  -d "line_items[0][price_data][unit_amount]=1000" \
  -d "line_items[0][price_data][currency]=usd" \
  -d "line_items[0][price_data][product_data][name]=Premium T-Shirt" \
  -d "line_items[0][price_data][product_data][description]=Comfortable cotton t-shirt" \
  --data-urlencode "line_items[0][price_data][product_data][images][0]=https://example.com/t-shirt.png" \
  -d "line_items[0][quantity]=1" \
  -d mode=payment \
  -d ui_mode=embedded_page \
  --data-urlencode "return_url=https://example.com/return"
```

## See also

- [Customize Checkout appearance](https://docs.stripe.com/payments/checkout/customization/appearance.md)
- [Products and prices](https://docs.stripe.com/products-prices/how-products-and-prices-work.md)
- [Product catalog](https://docs.stripe.com/payments/checkout/product-catalog.md)

