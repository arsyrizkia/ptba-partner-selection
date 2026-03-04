"use client";

import { cn } from "@/lib/utils/cn";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="border-b border-ptba-light-gray">
      <nav className="flex gap-0 -mb-px" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all whitespace-nowrap",
                "border-b-2 focus:outline-none",
                isActive
                  ? "border-b-ptba-gold text-ptba-navy"
                  : "border-b-transparent text-ptba-gray hover:text-ptba-navy hover:border-b-ptba-light-gray"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
