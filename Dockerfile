# syntax=docker/dockerfile:1

# ---- build stage -----------------------------------------------------------
FROM node:22-slim AS builder
WORKDIR /app

# IMPORTANT: Vite inlines VITE_* values into the JavaScript that ships to the
# browser, and it does so at BUILD time. Setting these as runtime environment
# variables has no effect — the bundle would silently keep the
# "placeholder.supabase.co" fallback from src/integrations/supabase/client.ts.
# They must be passed as build args.
#
# Only browser-safe values belong here. Never the Supabase service_role key or
# the Razorpay key SECRET — those would be published to every visitor.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_RAZORPAY_KEY_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID

# Fail loudly instead of shipping a site wired to a nonexistent backend.
RUN test -n "$VITE_SUPABASE_URL" \
 || (echo "FATAL: VITE_SUPABASE_URL build arg is required" >&2; exit 1)
RUN test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" \
 || (echo "FATAL: VITE_SUPABASE_PUBLISHABLE_KEY build arg is required" >&2; exit 1)

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Safety net: refuse to produce an image that leaks a service_role key into
# the client bundle. Cheap to run, catches a catastrophic mistake.
RUN if grep -rqs 'service_role' .output/public; then \
      echo "FATAL: a service_role key reached the client bundle. Aborting." >&2; \
      exit 1; \
    fi

# ---- runtime stage ---------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# nitro's node-server preset emits a self-contained server; no node_modules needed.
COPY --from=builder /app/.output ./.output

EXPOSE 3000

USER node

CMD ["node", ".output/server/index.mjs"]
