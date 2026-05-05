import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDeal, useUpdateDeal } from "@/hooks/useDeals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/deal/ImageUpload";

const categories = [
  "Things To Do", "Beauty & Spas", "Food & Drink",
  "Health & Fitness", "Goods", "Travel", "Auto", "Gifts", "Tickets"
];

interface SubOption {
  id: string;
  title: string;
  price: string;
  original_price: string;
}

export default function EditDeal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: deal, isLoading } = useDeal(id);
  const updateDeal = useUpdateDeal();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Food & Drink",
    originalPrice: "",
    dealPrice: "",
    totalQuantity: "",
    expiryDate: "",
    location: "",
    redemptionRules: "",
    status: "active",
  });
  const [images, setImages] = useState<string[]>([]);
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (deal && !initialized) {
      setForm({
        title: deal.title,
        description: deal.description || "",
        category: deal.category,
        originalPrice: deal.original_price || deal.originalPrice || "",
        dealPrice: deal.discounted_price || deal.price || "",
        totalQuantity: deal.vouchers_available || "",
        expiryDate: deal.expiry_date || deal.validUntil || "",
        location: deal.location || "",
        redemptionRules: deal.redemption_rules || "",
        status: deal.status || "active",
      });

      // Use image_urls array
      const imgs = deal.image_urls && deal.image_urls.length > 0
        ? [...deal.image_urls]
        : deal.image_url ? [deal.image_url] : [];
      setImages(imgs);

      // Use subDeals array
      if (deal.subDeals && deal.subDeals.length > 0) {
        setSubOptions(deal.subDeals.map((sd, i) => ({
          id: `so-${i}`,
          title: sd.title,
          price: sd.discounted_price || "",
          original_price: sd.original_price || "",
        })));
      }

      setInitialized(true);
    }
  }, [deal, initialized]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Deal not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/deals")}>Back to Deals</Button>
      </div>
    );
  }

  const discount = form.originalPrice && form.dealPrice
    ? Math.round((1 - Number(form.dealPrice) / Number(form.originalPrice)) * 100)
    : 0;

  const addSubOption = () => {
    setSubOptions((prev) => [...prev, { id: `so-${Date.now()}`, title: "", price: "", original_price: "" }]);
  };

  const updateSubOption = (soId: string, key: keyof SubOption, value: string) => {
    setSubOptions((prev) => prev.map((so) => so.id === soId ? { ...so, [key]: value } : so));
  };

  const removeSubOption = (soId: string) => {
    setSubOptions((prev) => prev.filter((so) => so.id !== soId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dealPrice || !form.originalPrice) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateDeal.mutate(
      {
        id: deal.id,
        updates: {
          title: form.title,
          description: form.description,
          category: form.category,
          original_price: form.originalPrice,
          originalPrice: form.originalPrice,
          discounted_price: form.dealPrice,
          price: form.dealPrice,
          discount_percentage: discount,
          discountPct: discount,
          vouchers_available: form.totalQuantity || deal.vouchers_available,
          image_url: images[0] || deal.image_url,
          image_urls: images,
          expiry_date: form.expiryDate || deal.expiry_date,
          validUntil: form.expiryDate || deal.validUntil,
          location: form.location || "",
          redemption_rules: form.redemptionRules || "",
          status: form.status,
        },
        subDeals: subOptions.filter((so) => so.title.trim()).map((so) => ({
          title: so.title,
          discounted_price: so.price,
          original_price: so.original_price || form.originalPrice,
          discount_percentage: so.original_price && so.price
            ? Math.round((1 - Number(so.price) / Number(so.original_price)) * 100)
            : discount,
        })),
      },
      { onSuccess: () => navigate("/deals") }
    );
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold">Edit Deal</h1>
          <p className="text-sm text-muted-foreground">Update the details of your deal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Deal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title *</label>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Category</label>
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Location</label>
              <input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Accra, East Legon" className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Redemption Rules</label>
              <textarea value={form.redemptionRules} onChange={(e) => update("redemptionRules", e.target.value)} rows={3} placeholder="e.g. Valid Mon-Fri only." className="flex w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Original Price (GH₵) *</label>
                <input type="number" value={form.originalPrice} onChange={(e) => update("originalPrice", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Deal Price (GH₵) *</label>
                <input type="number" value={form.dealPrice} onChange={(e) => update("dealPrice", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm">Discount:</span>
                <span className="font-heading font-bold text-primary">{discount}% OFF</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Total Quantity</label>
              <input type="number" value={form.totalQuantity} onChange={(e) => update("totalQuantity", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Sub-Options</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addSubOption} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Option
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {subOptions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No sub-options yet.</p>
            )}
            {subOptions.map((so, i) => (
              <div key={so.id} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                  <input value={so.title} onChange={(e) => updateSubOption(so.id, "title", e.target.value)} placeholder="Option title" className="flex h-9 flex-1 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeSubOption(so.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-8">
                  <div className="relative">
                    <label className="text-xs text-muted-foreground mb-1 block">Original Price</label>
                    <span className="absolute left-2.5 bottom-2 text-xs text-muted-foreground">GH₵</span>
                    <input type="number" value={so.original_price} onChange={(e) => updateSubOption(so.id, "original_price", e.target.value)} placeholder="0.00" className="flex h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </div>
                  <div className="relative">
                    <label className="text-xs text-muted-foreground mb-1 block">Discounted Price</label>
                    <span className="absolute left-2.5 bottom-2 text-xs text-muted-foreground">GH₵</span>
                    <input type="number" value={so.price} onChange={(e) => updateSubOption(so.id, "price", e.target.value)} placeholder="0.00" className="flex h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Schedule & Media</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <ImageUpload images={images} onChange={setImages} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={updateDeal.isPending}>
            {updateDeal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
