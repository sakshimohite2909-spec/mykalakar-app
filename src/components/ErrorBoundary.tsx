import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught error in application:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="min-h-screen w-full bg-[#F8F9FA] flex items-center justify-center p-6 font-sans antialiased">
          <div className="max-w-md w-full glass-card bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-red-50 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            
            <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <AlertCircle className="h-10 w-10" />
            </div>
            
            <h1 className="text-3xl font-black text-stone-950 mb-4">Something went wrong</h1>
            
            <p className="text-stone-500 font-bold text-sm mb-8">
              We've encountered an unexpected error. Our systems have logged this issue.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-stone-950 text-white font-black uppercase tracking-widest text-xs hover:bg-stone-800 transition-colors active:scale-95 shadow-xl shadow-stone-200"
              >
                <RefreshCw className="h-4 w-4" /> Reload Platform
              </button>
              
              <a
                href="/"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-white border border-stone-200 text-stone-950 font-black uppercase tracking-widest text-xs hover:bg-stone-50 transition-colors active:scale-95"
              >
                <Home className="h-4 w-4" /> Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
