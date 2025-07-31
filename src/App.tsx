
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { autoFixAuthErrors } from "@/lib/authFix";
import { suppressNonCriticalErrors } from "@/lib/errorSuppressor";
import { statePersistence } from "@/lib/statePersistence";
import AppLoader from "@/components/AppLoader";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import InitialRoute from "@/components/InitialRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import SafeSystemStandardization from "@/components/SafeSystemStandardization";
import ModuleSelection from "./pages/ModuleSelection";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Reports from "./pages/Reports";
import Settings from "@/pages/Settings";
import Finance from "./pages/Finance";
import PaymentPlanDetail from "./pages/PaymentPlanDetail";
import Cleaning from "./pages/Cleaning";
import Maintenance from "./pages/Maintenance";
import StudentPortal from "./pages/StudentPortal";
import StudentApplication from "./pages/StudentApplication";
import FilePreviewDemo from "./pages/FilePreviewDemo";
import NewLeads from "./pages/NewLeads";
import ColdLeads from "./pages/ColdLeads";
import DeadLeads from "./pages/DeadLeads";
import HotLeads from "./pages/HotLeads";
import ConvertedLeads from "./pages/ConvertedLeads";
import WhatsAppLeads from "./pages/WhatsAppLeads";
import TikTokLeads from "./pages/TikTokLeads";
import MetaAdsLeads from "./pages/MetaAdsLeads";
import DirectLeads from "./pages/DirectLeads";
import WebsiteLeads from "./pages/WebsiteLeads";
import GoogleAdsLeads from "./pages/GoogleAdsLeads";
import ReferralLeads from "./pages/ReferralLeads";
import GenericSourceLeads from "./pages/GenericSourceLeads";
import Websites from "./pages/Websites";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Auto-fix authentication errors and suppress non-critical console noise
autoFixAuthErrors();
suppressNonCriticalErrors();

const App = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  // Handle immediate state restoration for tab switching
  useEffect(() => {
    const handleImmediateStateRestored = (event: CustomEvent) => {
      // Force a re-render of the app when state is restored
      window.dispatchEvent(new Event('resize'));
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When tab becomes visible, force state restoration
        statePersistence.forceRestoration();
      }
    };

    // Listen for immediate state restoration events
    window.addEventListener('immediateStateRestored', handleImmediateStateRestored as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial state restoration check
    const savedState = statePersistence.loadState({ key: 'urbanhub-app-state', silent: true });
    if (savedState?.currentRoute) {
      const currentRoute = window.location.pathname + window.location.search;
      if (currentRoute !== savedState.currentRoute) {
        // Use a small delay to ensure the app is fully mounted
        setTimeout(() => {
          window.history.replaceState(null, '', savedState.currentRoute);
        }, 100);
      }
    }

    return () => {
      window.removeEventListener('immediateStateRestored', handleImmediateStateRestored as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppLoader>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {/* Temporarily disabled to prevent blank screen issues */}
              {/* <SafeSystemStandardization /> */}
              <BrowserRouter>
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/" element={<InitialRoute />} />
                <Route path="/modules" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson', 'accountant', 'cleaner']}>
                    <ModuleSelection />
                  </RoleBasedRoute>
                } />
                <Route path="/dashboard" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson', 'accountant', 'cleaner']}>
                    <Index />
                  </RoleBasedRoute>
                } />
                <Route path="/finance" element={
                  <RoleBasedRoute allowedRoles={['admin', 'accountant']}>
                    <Finance />
                  </RoleBasedRoute>
                } />
                <Route path="/finance/payment-plan/:planId" element={
                  <RoleBasedRoute allowedRoles={['admin', 'accountant']}>
                    <PaymentPlanDetail />
                  </RoleBasedRoute>
                } />
                <Route path="/cleaning" element={
                  <RoleBasedRoute allowedRoles={['admin', 'cleaner']}>
                    <Cleaning />
                  </RoleBasedRoute>
                } />
                <Route path="/maintenance" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'cleaner']}>
                    <Maintenance />
                  </RoleBasedRoute>
                } />
                <Route path="/reports" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson', 'accountant', 'cleaner', 'student']}>
                    <Reports />
                  </RoleBasedRoute>
                } />
                <Route path="/settings" element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <Settings />
                  </RoleBasedRoute>
                } />
                <Route path="/websites" element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <Websites />
                  </RoleBasedRoute>
                } />
                <Route path="/student/:studentId" element={
                  <RoleBasedRoute allowedRoles={['student', 'admin', 'manager']}>
                    <StudentPortal />
                  </RoleBasedRoute>
                } />
                <Route path="/application" element={
                  <RoleBasedRoute allowedRoles={['student', 'admin', 'manager']}>
                    <StudentApplication />
                  </RoleBasedRoute>
                } />
                <Route path="/file-preview-demo" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager']}>
                    <FilePreviewDemo />
                  </RoleBasedRoute>
                } />
                <Route path="/leads/new" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <NewLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/leads/cold" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <ColdLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/leads/dead" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <DeadLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/leads/hot" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <HotLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/leads/converted" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <ConvertedLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/whatsapp" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <WhatsAppLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/tiktok" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <TikTokLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/meta-ads" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <MetaAdsLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/direct" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <DirectLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/website" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <WebsiteLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/google-ads" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <GoogleAdsLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/referral" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <ReferralLeads />
                  </RoleBasedRoute>
                } />
                <Route path="/sources/:source" element={
                  <RoleBasedRoute allowedRoles={['admin', 'manager', 'salesperson']}>
                    <GenericSourceLeads />
                  </RoleBasedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppLoader>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
