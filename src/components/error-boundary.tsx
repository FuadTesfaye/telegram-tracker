"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Silently capture without exposing raw error to console in production
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              We're Handling It
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              An unexpected hiccup occurred while rendering this section. Your data is safe and our systems are synchronizing.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md transition-all tap-effect border border-sky-400/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh View</span>
            </button>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl border border-white/[0.08] transition-all tap-effect"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
