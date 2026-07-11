import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { MasterDataProvider } from "@/contexts/MasterDataContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppRouter from "@/AppRouter";
import { FirebaseDiagnostic } from "@/components/FirebaseDiagnostic";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <MasterDataProvider>
              {import.meta.env.DEV && <FirebaseDiagnostic />}
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppRouter />
              </TooltipProvider>
            </MasterDataProvider>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
