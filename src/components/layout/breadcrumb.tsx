"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-ptba-gray" />
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast ? "text-ptba-gray" : "font-medium text-ptba-navy"
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="font-medium text-ptba-navy transition-colors hover:text-ptba-steel-blue"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
