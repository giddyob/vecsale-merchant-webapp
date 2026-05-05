import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CouponRow {
  id: string;
  code: string;
  deal_id: string | null;
  option_id: string | null;
  user_id: string | null;
  status: string | null;
  purchase_date: string | null;
}

export interface CouponWithDeal extends CouponRow {
  dealTitle: string;
}

export function useMerchantCoupons() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["merchant_coupons", user?.uid],
    queryFn: async () => {
      // Get merchant's deals first
      const dealsQ = query(
        collection(db, "deals"),
        where("merchantId", "==", user!.uid)
      );
      const dealsSnap = await getDocs(dealsQ);
      if (dealsSnap.empty) return [];

      const dealMap: Record<string, string> = {};
      const dealIds: string[] = [];
      dealsSnap.docs.forEach((d) => {
        dealMap[d.id] = d.data().title;
        dealIds.push(d.id);
      });

      const allCoupons: CouponWithDeal[] = [];
      const batches = [];
      for (let i = 0; i < dealIds.length; i += 30) {
        batches.push(dealIds.slice(i, i + 30));
      }

      for (const batch of batches) {
        const couponsQ = query(
          collection(db, "coupons"),
          where("deal_id", "in", batch)
        );
        const couponsSnap = await getDocs(couponsQ);
        couponsSnap.docs.forEach((d) => {
          const data = d.data();
          allCoupons.push({
            id: d.id,
            ...data,
            dealTitle: dealMap[data.deal_id || ""] || "Unknown Deal",
          } as CouponWithDeal);
        });
      }

      return allCoupons.sort((a, b) =>
        (b.purchase_date || "").localeCompare(a.purchase_date || "")
      );
    },
    enabled: !!user,
  });
}

export function useRedeemCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponId: string) => {
      await updateDoc(doc(db, "coupons", couponId), { status: "REDEEMED" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant_coupons"] });
      toast.success("Voucher redeemed!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
