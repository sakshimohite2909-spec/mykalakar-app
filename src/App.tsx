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

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <MasterDataProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>
                <AppRouter />
              </ErrorBoundary>
            </TooltipProvider>
          </MasterDataProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
