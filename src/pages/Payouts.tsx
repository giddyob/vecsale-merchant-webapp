import { useState } from "react";
import { usePayouts, useRequestPayout } from "@/hooks/usePayouts";
import { useMerchantCoupons } from "@/hooks/useCoupons";
import { useDeals } from "@/hooks/useDeals";
import { useBusiness } from "@/hooks/useBusiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Clock, CheckCircle2, Loader2, DollarSign, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formatCurrency = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

const statusConfig: Record<string, { icon: any; badge: string }> = {
  pending: { icon: Clock, badge: "badge-warning" },
  processing: { icon: Loader2, badge: "badge-info" },
  completed: { icon: CheckCircle2, badge: "badge-success" },
  rejected: { icon: Clock, badge: "badge-destructive" },
};

const momoProviders = ["MTN Mobile Money", "Telecel Cash", "AirtelTigo Money"];

export default function Payouts() {
  const { data: payouts = [], isLoading } = usePayouts();
  const { data: coupons = [] } = useMerchantCoupons();
  const { data: deals = [] } = useDeals();
  const { data: business } = useBusiness();
  const requestPayout = useRequestPayout();
  const [requestAmount, setRequestAmount] = useState("");
  const [open, setOpen] = useState(false);
  const [methodType, setMethodType] = useState<"momo" | "bank" | "saved_momo" | "saved_bank">("saved_momo");

  const [newMomo, setNewMomo] = useState({ provider: "MTN Mobile Money", contact: "" });
  const [newBank, setNewBank] = useState({ bankName: "", accountNumber: "" });

  // Saved payout details from merchants collection
  const savedPayout = business?.payout_details;
  const hasSavedMomo = !!(savedPayout?.momoNumber);
  const hasSavedBank = !!(savedPayout?.accountNumber);

  // Build a map of deal prices for quick lookup
  const dealPriceMap = Object.fromEntries(
    deals.map((d) => [d.id, Number(d.discounted_price || d.price) || 0])
  );

  const totalRevenue = coupons.reduce((sum, c) => {
    const price = dealPriceMap[c.deal_id || ""] || 0;
    return sum + price;
  }, 0);

  const merchantRevenue = totalRevenue * 0.85;

  const totalPaidOut = payouts
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);

  const pendingPayout = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((s, p) => s + p.amount, 0);

  const availableBalance = merchantRevenue - totalPaidOut - pendingPayout;

  const handleRequest = () => {
    const amount = Number(requestAmount);
    if (!amount || amount <= 0) return;

    let methodLabel = "";
    if (methodType === "saved_momo" && savedPayout) {
      methodLabel = `${savedPayout.momoNetwork} — ${savedPayout.momoNumber}`;
    } else if (methodType === "saved_bank" && savedPayout) {
      methodLabel = `Bank: ${savedPayout.bankName} — ****${(savedPayout.accountNumber || "").slice(-4)}`;
    } else if (methodType === "momo") {
      methodLabel = `${newMomo.provider} — ${newMomo.contact}`;
    } else if (methodType === "bank") {
      methodLabel = `Bank: ${newBank.bankName} — ${newBank.accountNumber}`;
    }

    requestPayout.mutate(
      { amount, method: methodLabel },
      {
        onSuccess: () => {
          setRequestAmount("");
          setOpen(false);
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setMethodType(hasSavedMomo ? "saved_momo" : hasSavedBank ? "saved_bank" : "momo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">Payouts</h1>
          <p className="text-muted-foreground text-sm">Track your earnings and request payouts</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Request Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted text-sm">
                <span className="text-muted-foreground">Available balance: </span>
                <span className="font-heading font-bold">{formatCurrency(Math.max(0, availableBalance))}</span>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount (GH₵)</label>
                <input
                  type="number"
                  value={requestAmount}
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Payout Method</label>
                <div className="space-y-2">
                  {hasSavedMomo && (
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${methodType === "saved_momo" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                      <input type="radio" name="payout-method" checked={methodType === "saved_momo"} onChange={() => setMethodType("saved_momo")} className="accent-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Mobile Money</p>
                        <p className="text-xs text-muted-foreground truncate">{savedPayout?.momoNetwork} — {savedPayout?.momoNumber}</p>
                      </div>
                    </label>
                  )}
                  {hasSavedBank && (
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${methodType === "saved_bank" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                      <input type="radio" name="payout-method" checked={methodType === "saved_bank"} onChange={() => setMethodType("saved_bank")} className="accent-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Bank Account</p>
                        <p className="text-xs text-muted-foreground truncate">{savedPayout?.bankName} — ****{(savedPayout?.accountNumber || "").slice(-4)}</p>
                      </div>
                    </label>
                  )}
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${methodType === "momo" || methodType === "bank" ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                    <input type="radio" name="payout-method" checked={methodType === "momo" || methodType === "bank"} onChange={() => setMethodType("momo")} className="accent-primary" />
                    <span className="text-sm font-medium">Use a new payment method</span>
                  </label>
                </div>
              </div>

              {(methodType === "momo" || methodType === "bank") && (
                <div className="space-y-3 p-3 rounded-lg border border-dashed border-input">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                    <select
                      value={methodType}
                      onChange={(e) => setMethodType(e.target.value as "momo" | "bank")}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="momo">Mobile Money</option>
                      <option value="bank">Bank Account</option>
                    </select>
                  </div>
                  {methodType === "momo" ? (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
                        <select value={newMomo.provider} onChange={(e) => setNewMomo(p => ({ ...p, provider: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {momoProviders.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                        <input value={newMomo.contact} onChange={(e) => setNewMomo(p => ({ ...p, contact: e.target.value }))} placeholder="e.g. 024 123 4567" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
                        <input value={newBank.bankName} onChange={(e) => setNewBank(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. GCB Bank" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
                        <input value={newBank.accountNumber} onChange={(e) => setNewBank(p => ({ ...p, accountNumber: e.target.value }))} placeholder="e.g. 1234567890" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleRequest} disabled={requestPayout.isPending}>
                  {requestPayout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Earned</span>
            </div>
            <p className="font-heading text-2xl font-bold">{formatCurrency(merchantRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {coupons.length} voucher{coupons.length !== 1 ? "s" : ""} sold
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="font-heading text-2xl font-bold">{formatCurrency(pendingPayout)}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Available</span>
            </div>
            <p className="font-heading text-2xl font-bold">{formatCurrency(Math.max(0, availableBalance))}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Method</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const config = statusConfig[p.status] || statusConfig.pending;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-heading font-semibold">{formatCurrency(p.amount)}</td>
                      <td className="p-4 text-sm">{p.description || p.type}</td>
                      <td className="p-4">
                        <span className={`merchant-badge ${config.badge} capitalize`}>{p.status}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="sm:hidden divide-y">
            {payouts.map((p) => {
              const config = statusConfig[p.status] || statusConfig.pending;
              return (
                <div key={p.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading font-semibold text-sm">{formatCurrency(p.amount)}</span>
                    <span className={`merchant-badge ${config.badge} capitalize`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.description || p.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</p>
                </div>
              );
            })}
          </div>
          {payouts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No payouts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
