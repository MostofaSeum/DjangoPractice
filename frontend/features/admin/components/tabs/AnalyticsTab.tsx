"use client";

interface AnalyticsTabProps {
  // We can pass data props as needed
}

export default function AnalyticsTab({}: AnalyticsTabProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-secondary text-foreground p-8 rounded-3xl border border-foreground/10 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center pb-4 border-b border-foreground/10 mb-6">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              Store Analytics & Insights
            </h2>
            <p className="text-xs opacity-60 mt-1">
              Overview of your business performance, sales metrics, and customer insights.
            </p>
          </div>
        </div>

        {/* Placeholder / Initial Content */}
        <div className="p-12 rounded-2xl border-2 border-dashed border-foreground/15 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-2xl font-black shadow-sm">
            📊
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              Analytics Module Ready
            </h3>
            <p className="text-xs text-foreground/60 max-w-md mt-1">
              This section is set up and ready to be customized. Guide me on what charts, metrics, or insights you would like to display here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
