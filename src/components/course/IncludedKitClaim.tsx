import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/integrations/supabase/auth";
import { listAddresses, formatAddressLines, type SavedAddress } from "@/lib/addresses";
import { loadRazorpayScript } from "@/lib/razorpay-checkout";
import { fetchMyKitClaims, claimIncludedKit, verifyKitPayment } from "@/lib/includedKits";


export function IncludedKitClaim({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [addressId, setAddressId] = useState("");
  const [busy, setBusy] = useState(false);

  const claimsQ = useQuery({
    queryKey: ["my-kit-claims"],
    queryFn: fetchMyKitClaims,
    enabled: !!user,
  });
  const addrQ = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: () => listAddresses(user!.id),
    enabled: !!user && open,
  });

  const claim = claimsQ.data?.find((c) => c.course.id === String(courseId));
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-kit-claims"] });
  const addresses: SavedAddress[] = addrQ.data ?? [];
  const selected =
    addressId || addresses.find((a) => a.is_default)?.id || addresses[0]?.id || "";

  const confirm = async () => {
    if (!claim || (!selected && !claim.shipping_address_id)) return;
    setBusy(true);
    try {
      const r = await claimIncludedKit({
        coursePurchaseId: claim.course_purchase_id,
        shippingAddressId: claim.order ? (claim.shipping_address_id ?? selected) : selected,
        idempotencyKey: `kit-claim-${claim.id}`,
      });
      if (r.paymentRequired && r.razorpayOrderId && r.razorpayKeyId) {
        toast.message(`Shipping costs ₹${r.shippingAmount}. Complete the payment to confirm your kit.`);
        if (!(await loadRazorpayScript())) throw new Error("Could not load Razorpay. Check your connection.");
        const rz = new (window as any).Razorpay({
          key: r.razorpayKeyId,
          order_id: r.razorpayOrderId,
          currency: r.currency ?? "INR",
          name: "MakersFlow",
          description: `${claim.kit.name} kit shipping`,
          prefill: { email: (user as any)?.email ?? "" },
          handler: async (p: any) => {
            try {
              await verifyKitPayment({
                razorpay_order_id: p.razorpay_order_id,
                razorpay_payment_id: p.razorpay_payment_id,
                razorpay_signature: p.razorpay_signature,
              });
              toast.success("Payment received. Your kit order is confirmed.");
            } catch (e: any) {
              toast.error(e?.message ?? "Payment verification failed. Contact support if you were charged.");
            } finally {
              setOpen(false);
              refresh();
            }
          },
          modal: { ondismiss: () => refresh() },
        });
        rz.open();
      } else {
        if (r.requiresReconciliation) toast.message(r.message ?? "Payment received. We are finalising your kit order.");
        else toast.success(r.alreadyFulfilled ? "Your kit is already ordered." : "Your kit order is confirmed!");
        setOpen(false);
        refresh();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't claim your kit. Please try again.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!user || !claim) return null;

  if (claim.status === "fulfilled") {
    return (
      <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
        ✓ Kit ordered. <a href="/orders" className="font-medium underline">Track it in My Orders</a>
      </div>
    );
  }

  if (claim.order) {
    return (
      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Your kit order is waiting for the shipping payment.
        <button type="button" onClick={confirm} disabled={busy} className="mt-2 block w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Opening payment…" : "Complete shipping payment"}
        </button>
      </div>
    );
  }

  const btn =
    "w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

  if (!open) {
    return (
      <button type="button" className={`mt-4 ${btn}`} onClick={() => setOpen(true)}>
        Claim your free kit
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border p-3">
      <p className="text-sm font-medium">Ship your kit to</p>
      {addrQ.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading addresses…</p>
      ) : addresses.length === 0 ? (
        <p className="text-xs">No saved addresses yet.</p>
      ) : (
        addresses.map((a) => (
          <label key={a.id} className="flex cursor-pointer gap-2 rounded-md border p-2 text-xs">
            <input type="radio" name="kit-address" checked={selected === a.id} onChange={() => setAddressId(a.id)} />
            <span>
              <span className="font-medium">{a.full_name}{a.is_default ? " (default)" : ""}</span>
              <br />
              {formatAddressLines(a).join(", ")}
            </span>
          </label>
        ))
      )}
      <a href="/profile" className="block text-xs underline">Add or edit addresses</a>
      <button type="button" className={btn} disabled={busy || !selected} onClick={confirm}>
        {busy ? "Confirming…" : "Confirm & order kit"}
      </button>
      <p className="text-[11px] text-muted-foreground">
        The kit is free. If shipping has a charge, you'll be asked to pay it next.
      </p>
    </div>
  );
}
