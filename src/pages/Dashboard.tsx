import { useDeals } from "@/hooks/useDeals";
import { useMerchantCoupons } from "@/hooks/useCoupons";
import { usePayouts } from "@/hooks/usePayouts";
import { DollarSign, ShoppingBag, QrCode, Tag, TrendingUp, ArrowUpRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const formatCurrency = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: coupons = [], isLoading: couponsLoading } = useMerchantCoupons();
  const { data: payouts = [], isLoading: payoutsLoading } = usePayouts();

  const loading = dealsLoading || couponsLoading || payoutsLoading;

  const totalRevenue = deals.reduce((s, d) => s + (d.sold_count || 0) * (Number(d.discounted_price || d.price) || 0), 0);
  const totalSold = deals.reduce((s, d) => s + (d.sold_count || 0), 0);
  const totalRedeemed = coupons.filter((c) => c.status === "REDEEMED").length;
  const activeDeals = deals.filter((d) => d.status === "active").length;
  const pendingPayout = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((s, p) => s + p.amount, 0);

  const statCards = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-primary" },
    { label: "Deals Sold", value: totalSold.toString(), icon: ShoppingBag, color: "text-info" },
    { label: "Redeemed", value: totalRedeemed.toString(), icon: QrCode, color: "text-warning" },
    { label: "Active Deals", value: activeDeals.toString(), icon: Tag, color: "text-primary" },
  ];

  const topDeals = [...deals]
    .filter((d) => d.status === "active")
    .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
    .slice(0, 3);

  const recentCoupons = coupons.slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Here's your overview.</p>
        </div>
        <Link to="/deals/new">
          <Button className="gap-2">
            <Tag className="h-4 w-4" />
            New Deal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="font-heading text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-heading">Top Performing Deals</CardTitle>
            <Link to="/deals" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDeals.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No active deals yet</p>
            )}
            {topDeals.map((deal) => {
              const discountedPrice = Number(deal.discounted_price || deal.price) || 0;
              const discountPct = deal.discount_percentage || deal.discountPct || 0;
              const vouchersAvail = Number(deal.vouchers_available) || 0;
              return (
                <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <img src={deal.image_url || "/placeholder.svg"} alt={deal.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.sold_count || 0}/{vouchersAvail} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatCurrency(discountedPrice)}</p>
                    <p className="text-xs text-primary">{discountPct}% off</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-heading">Recent Vouchers</CardTitle>
            <Link to="/redemptions" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCoupons.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No vouchers yet</p>
            )}
            {recentCoupons.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.dealTitle}</p>
                  <p className="text-xs text-muted-foreground">{r.code}</p>
                </div>
                <span className={`merchant-badge ${r.status === "REDEEMED" ? "badge-success" : r.status === "UNUSED" ? "badge-warning" : "badge-destructive"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {pendingPayout > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Pending Payout</p>
                <p className="font-heading text-xl font-bold">{formatCurrency(pendingPayout)}</p>
              </div>
            </div>
            <Link to="/payouts">
              <Button variant="outline" size="sm">View Payouts</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
