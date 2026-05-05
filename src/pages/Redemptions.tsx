import { useState } from "react";
import { useMerchantCoupons, useRedeemCoupon } from "@/hooks/useCoupons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Search, CheckCircle2, Clock, XCircle, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { QrScannerDialog } from "@/components/QrScannerDialog";

export default function Redemptions() {
  const { data: coupons = [], isLoading } = useMerchantCoupons();
  const redeemCoupon = useRedeemCoupon();
  const [search, setSearch] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [scannerOpen, setScannerOpen] = useState(false);

  const redeemByCode = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    const normalized = code.startsWith("VS-") ? code : `VS-${code}`;
    const found = coupons.find(
      (r: any) => r.code?.toUpperCase() === normalized
    );
    if (!found) {
      toast.error(`Voucher ${normalized} not found`);
      return;
    }
    if (found.status === "REDEEMED") {
      toast.error("This voucher has already been redeemed");
      return;
    }
    redeemCoupon.mutate(found.id);
  };

  const filtered = coupons
    .filter((r: any) => filter === "all" || r.status?.toLowerCase() === filter)
    .filter(
      (r: any) =>
        r.code?.toLowerCase().includes(search.toLowerCase()) ||
        r.dealTitle?.toLowerCase().includes(search.toLowerCase())
    );

  const fullCode = `VS-${redeemCode}`;

  const handleRedeem = () => {
    if (redeemCode.length !== 8) {
      toast.error("Voucher code must be 8 characters after VS-");
      return;
    }
    redeemByCode(fullCode);
    setRedeemCode("");
  };

  const statusIcon: Record<string, React.ReactNode> = {
    UNUSED: <Clock className="h-4 w-4 text-warning" />,
    REDEEMED: <CheckCircle2 className="h-4 w-4 text-success" />,
    EXPIRED: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusBadge: Record<string, string> = {
    UNUSED: "badge-warning",
    REDEEMED: "badge-success",
    EXPIRED: "badge-destructive",
  };

  const pendingCount = coupons.filter((r: any) => r.status === "UNUSED").length;
  const redeemedCount = coupons.filter((r: any) => r.status === "REDEEMED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold">Redemptions</h1>
        <p className="text-muted-foreground text-sm">Manage and redeem customer vouchers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-heading font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Unused</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-heading font-bold">{redeemedCount}</p>
              <p className="text-xs text-muted-foreground">Redeemed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-heading font-bold">{coupons.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Redeem input */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Redeem a Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center h-11 rounded-lg border bg-background px-3 font-mono text-sm tracking-wider flex-1">
              <span className="text-muted-foreground">VS</span>
              <span className="mx-2 text-muted-foreground">-</span>
              <input
                value={redeemCode}
                onChange={(e) =>
                  setRedeemCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
                  )
                }
                placeholder="XXXXXXXX"
                maxLength={8}
                className="flex-1 bg-transparent outline-none min-w-0 tracking-wider"
                onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRedeem} className="gap-2 h-11 flex-1 sm:flex-none" disabled={redeemCoupon.isPending}>
                <CheckCircle2 className="h-4 w-4" />
                Redeem
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setScannerOpen(true)}
                className="gap-2 h-11 flex-1 sm:flex-none"
              >
                <ScanLine className="h-4 w-4" />
                Scan QR
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Enter the 8-character voucher code or scan the customer's QR code.
          </p>
        </CardContent>
      </Card>

      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(code) => redeemByCode(code)}
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by code or deal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
          {["all", "unused", "redeemed", "expired"].map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize whitespace-nowrap shrink-0">
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Voucher list */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Deal</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Code</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Purchase Date</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-sm font-medium">{r.dealTitle}</td>
                    <td className="p-4">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{r.code}</code>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {statusIcon[r.status || "UNUSED"]}
                        <span className="text-sm">{r.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {r.purchase_date ? new Date(r.purchase_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "UNUSED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => redeemCoupon.mutate(r.id)}
                          disabled={redeemCoupon.isPending}
                        >
                          Redeem
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y">
            {filtered.map((r: any) => (
              <div key={r.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug flex-1 min-w-0">{r.dealTitle}</p>
                  <span className={`merchant-badge ${statusBadge[r.status || "UNUSED"]} shrink-0`}>
                    {r.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{r.code}</code>
                  <span className="text-xs text-muted-foreground">
                    {r.purchase_date ? new Date(r.purchase_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                {r.status === "UNUSED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => redeemCoupon.mutate(r.id)}
                    disabled={redeemCoupon.isPending}
                  >
                    Redeem
                  </Button>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No vouchers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
