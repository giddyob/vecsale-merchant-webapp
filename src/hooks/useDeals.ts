import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Deal, SubDeal } from "@/integrations/firebase/types";

export type DealRow = Deal;

export function useDeals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deals", user?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, "deals"),
        where("merchantId", "==", user!.uid)
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DealRow));
      return rows.sort((a, b) =>
        (b.createdAt || "").localeCompare(a.createdAt || "")
      );
    },
    enabled: !!user,
  });
}

export function useDeal(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "deals", id!));
      if (!snap.exists()) throw new Error("Deal not found");
      const data = snap.data();
      if (data.merchantId !== user!.uid) throw new Error("Unauthorized");
      return { id: snap.id, ...data } as DealRow;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (deal: {
      title: string;
      description: string;
      category: string;
      original_price: string;
      discounted_price: string;
      discount_percentage: number;
      vouchers_available: string;
      image_url: string;
      image_urls: string[];
      expiry_date: string;
      redemption_rules?: string;
      location?: string;
      status: string;
      subDeals?: SubDeal[];
    }) => {
      const { subDeals, ...rest } = deal;
      const cleanData = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v !== undefined)
      );
      const dealRef = await addDoc(collection(db, "deals"), {
        ...cleanData,
        // duplicate fields to match existing Firestore schema
        originalPrice: deal.original_price,
        price: deal.discounted_price,
        discountPct: deal.discount_percentage,
        validUntil: deal.expiry_date,
        merchantId: user!.uid,
        sold_count: 0,
        createdAt: new Date().toISOString(),
        subDeals: subDeals && subDeals.length > 0 ? subDeals : [],
      });

      return { id: dealRef.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      subDeals,
    }: {
      id: string;
      updates: Record<string, any>;
      subDeals?: SubDeal[];
    }) => {
      const dealRef = doc(db, "deals", id);
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      if (subDeals !== undefined) {
        cleanUpdates.subDeals = subDeals;
      }
      await updateDoc(dealRef, cleanUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal"] });
      toast.success("Deal updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "deals", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
