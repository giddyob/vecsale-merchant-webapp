import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Deals from "./pages/Deals";
import CreateDeal from "./pages/CreateDeal";
import EditDeal from "./pages/EditDeal";
import Redemptions from "./pages/Redemptions";
import Payouts from "./pages/Payouts";
import MerchantSettings from "./pages/MerchantSettings";
import { MerchantLayout } from "./components/merchant/MerchantLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<MerchantLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/new" element={<CreateDeal />} />
              <Route path="/deals/:id/edit" element={<EditDeal />} />
              <Route path="/redemptions" element={<Redemptions />} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/settings" element={<MerchantSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
