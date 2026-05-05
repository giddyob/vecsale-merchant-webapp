import { useState } from "react";
import { useDeals, useDeleteDeal, useUpdateDeal } from "@/hooks/useDeals";
import { useBusiness } from "@/hooks/useBusiness";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, Search, MoreVertical, Pause, Play, Trash2, Edit, Loader2, AlertCircle, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { checkProfileCompletion } from "@/lib/profileCompletion";

const statusColors: Record<string, string> = {
  active: "badge-success",
  paused: "badge-warning",
  expired: "badge-destructive",
  draft: "badge-info",
};

const formatCurrency = (amount: number) =>
  `GH₵ ${amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

export default function Deals() {
  const { data: deals = [], isLoading } = useDeals();
  const { data: business } = useBusiness();
  const completion = checkProfileCompletion(business);
  const deleteDeal = useDeleteDeal();
  const updateDeal = useUpdateDeal();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = deals
    .filter((d) => filter === "all" || d.status === filter)
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = (id: string, currentStatus: string | null) => {
    updateDeal.mutate({
      id,
      updates: { status: currentStatus === "active" ? "paused" : "active" },
    });
  };

  const filters = ["all", "active", "paused", "expired", "draft"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Deals</h1>
          <p className="text-muted-foreground text-sm">{deals.length} total deals</p>
        </div>
        <Link to="/deals/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Deal
          </Button>
        </Link>
      </div>

      {!completion.isComplete && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Complete your merchant profile to publish deals
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Missing: {completion.missing.join(", ")}
              </p>
            </div>
            <Link to="/settings" className="shrink-0">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Settings className="h-3.5 w-3.5" /> Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 shrink-0">
          {filters.map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize whitespace-nowrap shrink-0">
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((deal, i) => {
          const discountedPrice = Number(deal.discounted_price || deal.price) || 0;
          const originalPrice = Number(deal.original_price || deal.originalPrice) || 0;
          const discountPct = deal.discount_percentage || deal.discountPct || 0;
          const vouchersAvail = Number(deal.vouchers_available) || 0;

          return (
            <Card key={deal.id} className="overflow-hidden animate-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="relative">
                <img src={deal.image_url || "/placeholder.svg"} alt={deal.title} className="h-40 w-full object-cover" />
                <span className={`merchant-badge ${statusColors[deal.status || "draft"]} absolute top-3 left-3`}>
                  {deal.status || "draft"}
                </span>
                <span className="merchant-badge bg-foreground/80 text-background absolute top-3 right-3">
                  {discountPct}% OFF
                </span>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-sm truncate">{deal.title}</h3>
                    <p className="text-xs text-muted-foreground">{deal.category}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/deals/${deal.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(deal.id, deal.status)}>
                        {deal.status === "active" ? (
                          <><Pause className="mr-2 h-4 w-4" /> Pause</>
                        ) : (
                          <><Play className="mr-2 h-4 w-4" /> Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteDeal.mutate(deal.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-heading text-lg font-bold">{formatCurrency(discountedPrice)}</span>
                  <span className="text-sm text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Sold</span>
                    <span className="font-medium">{deal.sold_count || 0}/{vouchersAvail}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${vouchersAvail ? ((deal.sold_count || 0) / vouchersAvail) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  {(deal.expiry_date || deal.validUntil) && (
                    <span>Ends {new Date(deal.expiry_date || deal.validUntil || "").toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No deals found</p>
          <p className="text-sm mt-1">Try adjusting your search or create your first deal</p>
        </div>
      )}
    </div>
  );
}
