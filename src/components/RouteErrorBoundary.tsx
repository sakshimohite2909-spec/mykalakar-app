import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RouteErrorBoundary() {
  const error: any = useRouteError();
  const navigate = useNavigate();

  console.error("Route rendering crash captured:", error);

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-8 shadow-sm backdrop-blur-sm max-w-md w-full">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-black text-stone-900 mb-2">
          We hit a snag loading this page
        </h2>
        <p className="text-sm font-semibold text-stone-500 mb-6 leading-relaxed">
          {error?.message || error?.statusText || "An unexpected error occurred while rendering this component."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-full border-stone-200 text-xs font-extrabold uppercase tracking-widest text-stone-700 shadow-sm transition hover:border-orange-200 hover:text-orange-600 h-11 px-5"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Go Back
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="rounded-full bg-orange-600 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm transition hover:bg-orange-700 h-11 px-5"
          >
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
