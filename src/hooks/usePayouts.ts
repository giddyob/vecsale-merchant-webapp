import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TransactionRow {
  id: string;
  amount: number;
  status: string;
  type: string;
  user_id: string;
  date: string;
  description: string | null;
  created_at: string | null;
}

export function usePayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payouts", user?.uid],
    queryFn: async () => {
      const q = query(
        collection(db, "transactions"),
        where("user_id", "==", user!.uid),
        where("type", "==", "payout")
      );
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TransactionRow));
      return rows.sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
    },
    enabled: !!user,
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, method }: { amount: number; method: string }) => {
      await addDoc(collection(db, "transactions"), {
        amount,
        status: "pending",
        type: "payout",
        user_id: user!.uid,
        description: `Payout via ${method}`,
        date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast.success("Payout request submitted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
