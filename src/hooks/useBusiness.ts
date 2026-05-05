import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Merchant } from "@/integrations/firebase/types";

export type BusinessRow = Merchant;

export function useBusiness() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["business", user?.uid],
    queryFn: async () => {
      const snap = await getDoc(doc(db, "merchants", user!.uid));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as BusinessRow;
    },
    enabled: !!user,
  });
}

export function useUpsertBusiness() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<BusinessRow>) => {
      const cleanData = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await setDoc(
        doc(db, "merchants", user!.uid),
        { ...cleanData, updated_at: serverTimestamp() },
        { merge: true }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Profile updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
