import type { Merchant } from "@/integrations/firebase/types";

export interface ProfileCompletion {
  isComplete: boolean;
  missing: string[];
}

export function checkProfileCompletion(
  business: Partial<Merchant> | null | undefined
): ProfileCompletion {
  const missing: string[] = [];
  if (!business) {
    return {
      isComplete: false,
      missing: [
        "Business name",
        "Email",
        "Phone",
        "Location",
        "Category",
        "Description",
        "Payout details",
      ],
    };
  }

  const name = business.name || business.businessName;
  if (!name?.trim()) missing.push("Business name");
  if (!business.email?.trim()) missing.push("Email");
  if (!business.phone?.trim()) missing.push("Phone");
  if (!business.location?.trim()) missing.push("Location");
  if (!business.category?.trim()) missing.push("Category");
  if (!business.description?.trim()) missing.push("Description");

  const p = business.payout_details;
  const hasMomo = !!(p?.momoNumber?.trim() && p?.momoNetwork?.trim());
  const hasBank = !!(p?.bankName?.trim() && p?.accountNumber?.trim());
  if (!hasMomo && !hasBank) missing.push("Payout details (Mobile Money or Bank)");

  return { isComplete: missing.length === 0, missing };
}
