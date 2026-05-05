import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness, useUpsertBusiness } from "@/hooks/useBusiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Mail, Phone, MapPin, Pencil, X, Check, Loader2, Wallet, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const momoProviders = ["MTN Mobile Money", "Telecel Cash", "AirtelTigo Money"];
const businessCategories = [
  "Things To Do", "Beauty & Spas", "Food & Drink",
  "Health & Fitness", "Goods", "Travel", "Auto", "Gifts", "Tickets"
];

export default function MerchantSettings() {
  const { user } = useAuth();
  const { data: business, isLoading } = useBusiness();
  const upsertBusiness = useUpsertBusiness();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    category: "",
    opening_hours: "",
    description: "",
  });

  // Payout details from the flat payout_details map
  const [payoutDetails, setPayoutDetails] = useState({
    momoNetwork: "MTN Mobile Money",
    momoNumber: "",
    bankName: "",
    accountNumber: "",
  });
  const [editingPayout, setEditingPayout] = useState(false);

  useEffect(() => {
    if (business?.payout_details) {
      setPayoutDetails({
        momoNetwork: business.payout_details.momoNetwork || "MTN Mobile Money",
        momoNumber: business.payout_details.momoNumber || "",
        bankName: business.payout_details.bankName || "",
        accountNumber: business.payout_details.accountNumber || "",
      });
    }
  }, [business?.payout_details]);

  const startEditing = () => {
    setForm({
      name: business?.name || business?.businessName || user?.displayName || "",
      email: business?.email || user?.email || "",
      phone: business?.phone || "",
      location: business?.location || "",
      category: business?.category || "",
      opening_hours: business?.opening_hours || "",
      description: business?.description || "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    upsertBusiness.mutate(
      {
        name: form.name,
        businessName: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        category: form.category,
        opening_hours: form.opening_hours,
        description: form.description,
      } as any,
      { onSuccess: () => setEditing(false) }
    );
  };

  const handleSavePayout = () => {
    upsertBusiness.mutate(
      {
        payout_details: payoutDetails,
      } as any,
      {
        onSuccess: () => {
          setEditingPayout(false);
          toast.success("Payout details saved!");
        },
      }
    );
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const displayName = business?.name || business?.businessName || user?.displayName || "Your Business";
  const displayEmail = business?.email || user?.email || "";
  const logoUrl = business?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=22c55e&color=fff&size=128&bold=true`;

  const profileFields = [
    { icon: Mail, label: "Email", key: "email", value: editing ? form.email : displayEmail },
    { icon: Phone, label: "Phone", key: "phone", value: editing ? form.phone : (business?.phone || "Not set") },
    { icon: MapPin, label: "Location", key: "location", value: editing ? form.location : (business?.location || "Not set") },
    { icon: Store, label: "Category", key: "category", value: editing ? form.category : (business?.category || "Not set") },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your merchant account</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading">Business Profile</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={upsertBusiness.isPending} className="gap-1.5">
                {upsertBusiness.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={logoUrl} alt={displayName} className="h-16 w-16 rounded-xl" />
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-heading font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ) : (
                <>
                  <p className="font-heading font-bold text-lg">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{business?.category || "No category"}</p>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            {profileFields.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {editing ? (
                    item.key === "category" ? (
                      <select
                        value={item.value}
                        onChange={(e) => update(item.key, e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                      >
                        <option value="">Select category</option>
                        {businessCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input
                        value={item.value}
                        onChange={(e) => update(item.key, e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                      />
                    )
                  ) : (
                    <p className="text-sm font-medium">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Opening Hours</p>
                  <input
                    value={form.opening_hours}
                    onChange={(e) => update("opening_hours", e.target.value)}
                    placeholder="e.g. 8:00 AM - 6:00 PM"
                    className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payout Details
          </CardTitle>
          {!editingPayout ? (
            <Button variant="outline" size="sm" onClick={() => setEditingPayout(true)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditingPayout(false)} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSavePayout} disabled={upsertBusiness.isPending} className="gap-1.5">
                {upsertBusiness.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile Money */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-sm font-heading font-semibold">Mobile Money</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Network</label>
              {editingPayout ? (
                <select
                  value={payoutDetails.momoNetwork}
                  onChange={(e) => setPayoutDetails(p => ({ ...p, momoNetwork: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {momoProviders.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ) : (
                <p className="text-sm">{payoutDetails.momoNetwork || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
              {editingPayout ? (
                <input
                  value={payoutDetails.momoNumber}
                  onChange={(e) => setPayoutDetails(p => ({ ...p, momoNumber: e.target.value }))}
                  placeholder="e.g. 024 123 4567"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ) : (
                <p className="text-sm">{payoutDetails.momoNumber || "Not set"}</p>
              )}
            </div>
          </div>

          {/* Bank Account */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-sm font-heading font-semibold">Bank Account</p>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bank Name</label>
              {editingPayout ? (
                <input
                  value={payoutDetails.bankName}
                  onChange={(e) => setPayoutDetails(p => ({ ...p, bankName: e.target.value }))}
                  placeholder="e.g. GCB Bank"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ) : (
                <p className="text-sm">{payoutDetails.bankName || "Not set"}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Account Number</label>
              {editingPayout ? (
                <input
                  value={payoutDetails.accountNumber}
                  onChange={(e) => setPayoutDetails(p => ({ ...p, accountNumber: e.target.value }))}
                  placeholder="e.g. 1234567890"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ) : (
                <p className="text-sm">{payoutDetails.accountNumber || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
