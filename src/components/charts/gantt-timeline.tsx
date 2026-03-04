"use client";

import { useState } from "react";

interface TimelineStep {
  step: number;
  name: string;
  description: string;
}

interface GanttTimelineProps {
  steps: TimelineStep[];
  currentStep: number;
  title?: string;
}

const COLORS = {
  completed: "#28A745",
  current: "#F2A900",
  pending: "#E8E8E8",
  pendingBorder: "#d1d5db",
};

export default function GanttTimeline({
  steps,
  currentStep,
  title,
}: GanttTimelineProps) {
  const [hoveredStep, setHoveredStep] = useState<TimelineStep | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  function getStepStatus(stepNum: number): "completed" | "current" | "pending" {
    if (stepNum < currentStep) return "completed";
    if (stepNum === currentStep) return "current";
    return "pending";
  }

  function getCircleStyles(status: "completed" | "current" | "pending") {
    switch (status) {
      case "completed":
        return {
          backgroundColor: COLORS.completed,
          border: `2px solid ${COLORS.completed}`,
          color: "#ffffff",
        };
      case "current":
        return {
          backgroundColor: COLORS.current,
          border: `2px solid ${COLORS.current}`,
          color: "#ffffff",
        };
      case "pending":
        return {
          backgroundColor: "#ffffff",
          border: `2px solid ${COLORS.pendingBorder}`,
          color: "#9ca3af",
        };
    }
  }

  function getLineColor(fromStep: number): string {
    if (fromStep < currentStep) return COLORS.completed;
    return COLORS.pending;
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">{title}</h3>
      )}

      {/* Pulse animation for current step */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(242, 169, 0, 0.5);
          }
          70% {
            box-shadow: 0 0 0 8px rgba(242, 169, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(242, 169, 0, 0);
          }
        }
        .timeline-pulse {
          animation: pulse-ring 2s ease-in-out infinite;
        }
      `}</style>

      <div className="overflow-x-auto pb-4">
        <div
          className="flex items-start"
          style={{ minWidth: steps.length * 100 }}
        >
          {steps.map((step, idx) => {
            const status = getStepStatus(step.step);
            const circleStyles = getCircleStyles(status);
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.step}
                className="flex flex-col items-center relative"
                style={{ flex: 1, minWidth: 80 }}
              >
                {/* Circle + Line row */}
                <div className="flex items-center w-full">
                  {/* Left line */}
                  {idx > 0 && (
                    <div
                      className="flex-1 h-0.5"
                      style={{
                        backgroundColor: getLineColor(steps[idx - 1].step),
                      }}
                    />
                  )}
                  {idx === 0 && <div className="flex-1" />}

                  {/* Circle */}
                  <div
                    className={`relative flex items-center justify-center w-9 h-9 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                      status === "current" ? "timeline-pulse" : ""
                    }`}
                    style={circleStyles}
                    onMouseEnter={(e) => {
                      setHoveredStep(step);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    <span className="text-xs font-bold">{step.step}</span>
                  </div>

                  {/* Right line */}
                  {!isLast && (
                    <div
                      className="flex-1 h-0.5"
                      style={{
                        backgroundColor: getLineColor(step.step),
                      }}
                    />
                  )}
                  {isLast && <div className="flex-1" />}
                </div>

                {/* Step name label */}
                <div className="mt-2 px-1 text-center w-full">
                  <p
                    className="text-[10px] leading-tight text-[#1A1A1A] truncate"
                    title={step.name}
                  >
                    {step.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredStep && (
        <div
          className="fixed z-50 px-3 py-2 rounded-lg shadow-lg border border-gray-200 pointer-events-none max-w-xs"
          style={{
            backgroundColor: "#ffffff",
            left: tooltipPos.x,
            top: tooltipPos.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-bold text-[#1B3A5C]">
            Step {hoveredStep.step}: {hoveredStep.name}
          </p>
          <p className="text-[11px] text-[#1A1A1A] mt-1">
            {hoveredStep.description}
          </p>
        </div>
      )}
    </div>
  );
}
