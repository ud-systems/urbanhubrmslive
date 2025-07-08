
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NewLeads from "./pages/NewLeads";
import ColdLeads from "./pages/ColdLeads";
import DeadLeads from "./pages/DeadLeads";
import HotLeads from "./pages/HotLeads";
import ConvertedLeads from "./pages/ConvertedLeads";
import WhatsAppLeads from "./pages/WhatsAppLeads";
import TikTokLeads from "./pages/TikTokLeads";
import MetaAdsLeads from "./pages/MetaAdsLeads";
import DirectLeads from "./pages/DirectLeads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/leads/new" element={
                <ProtectedRoute>
                  <NewLeads />
                </ProtectedRoute>
              } />
              <Route path="/leads/cold" element={
                <ProtectedRoute>
                  <ColdLeads />
                </ProtectedRoute>
              } />
              <Route path="/leads/dead" element={
                <ProtectedRoute>
                  <DeadLeads />
                </ProtectedRoute>
              } />
              <Route path="/leads/hot" element={
                <ProtectedRoute>
                  <HotLeads />
                </ProtectedRoute>
              } />
              <Route path="/leads/converted" element={
                <ProtectedRoute>
                  <ConvertedLeads />
                </ProtectedRoute>
              } />
              <Route path="/sources/whatsapp" element={
                <ProtectedRoute>
                  <WhatsAppLeads />
                </ProtectedRoute>
              } />
              <Route path="/sources/tiktok" element={
                <ProtectedRoute>
                  <TikTokLeads />
                </ProtectedRoute>
              } />
              <Route path="/sources/meta-ads" element={
                <ProtectedRoute>
                  <MetaAdsLeads />
                </ProtectedRoute>
              } />
              <Route path="/sources/direct" element={
                <ProtectedRoute>
                  <DirectLeads />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
