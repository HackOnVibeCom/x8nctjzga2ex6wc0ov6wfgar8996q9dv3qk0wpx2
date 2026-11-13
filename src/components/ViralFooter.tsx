import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ViralFooterProps {
  onCreateNew: () => void;
}

export const ViralFooter: React.FC<ViralFooterProps> = ({ onCreateNew }) => {
  return (
    <footer className="w-full bg-white border-t border-slate-100 py-6 px-4 text-slate-600">
      <div className="mx-auto max-w-sm text-center space-y-3">
        {/* Subtle conversion callout */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-3.5 space-y-2">
          <p className="text-xs font-semibold text-slate-800">
            Hosting your next group outing?
          </p>
          <p className="text-[11px] text-slate-500">
            Create an Ipin split in 10 seconds. Free, zero sign-up required.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>Create Split Room</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Ipin • Built for HackOnVibe 2026 by Team lit-up
        </p>
      </div>
    </footer>
  );
};
