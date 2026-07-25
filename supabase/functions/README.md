# Supabase Edge Functions

> [!WARNING]
> **DO NOT DEPLOY MOBILE-OWNED EDGE FUNCTIONS FROM THIS WEB REPOSITORY**

The following functions are owned, updated, and deployed exclusively from the **Mobile Repository**:

- `create-razorpay-order`
- `verify-razorpay-payment`
- `razorpay-webhook`

### Mobile Ownership Details

- `create-razorpay-order`: Uses timingSafeEqual signature comparison and triggers order creation.
- `verify-razorpay-payment`: Handles payment verification and HMAC validation.
- `razorpay-webhook`: Triggers Shiprocket order creation on `payment.captured`.

Do **NOT** re-create local directories for these functions in this web repository or run `supabase functions deploy` for them from here. The web application calls the deployed functions by string name (`create-razorpay-order`, `verify-razorpay-payment`) via `supabase.functions.invoke(...)`.
