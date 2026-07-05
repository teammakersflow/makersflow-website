-- Add failure_reason and failure_code to payments table
-- These are saved by the razorpay-webhook when payment.failed event fires

alter table public.payments 
  add column if not exists failure_reason  text,
  add column if not exists failure_code    text,
  add column if not exists failure_description text;

notify pgrst, 'reload schema';
