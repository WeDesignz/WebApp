"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  FilePlus2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

export type PDFStatus = "pending" | "processing" | "completed" | "failed";

interface PDFStatusCardProps {
  status: PDFStatus;
  downloadProgress?: number | null;
  onGenerateClick?: () => void;
  onDownloadClick?: () => void;
  compact?: boolean;
}

const STEPS = [
  { id: "pending", label: "Request created", shortLabel: "Created" },
  { id: "processing", label: "Generating PDF", shortLabel: "Generating" },
  { id: "completed", label: "Ready to download", shortLabel: "Ready" },
];

const STATUS_CONFIG = {
  pending: {
    icon: FilePlus2,
    color: "text-amber-500",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    borderColor: "border-amber-500/30",
    pulseColor: "bg-amber-500/20",
    title: "PDF Request Created",
    description: "Click below to generate your PDF. It will be created on-demand.",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    borderColor: "border-blue-500/30",
    pulseColor: "bg-blue-500/20",
    title: "Generating Your PDF",
    description: "Adding designs to your PDF. This usually takes 30–60 seconds.",
    subSteps: [
      "Collecting design images",
      "Building PDF pages",
      "Finalizing file",
    ],
  },
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgGradient: "from-green-500/10 to-emerald-500/10",
    borderColor: "border-green-500/30",
    pulseColor: "bg-green-500/20",
    title: "PDF Ready!",
    description: "Your PDF is ready to download.",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-500",
    bgGradient: "from-red-500/10 to-rose-500/10",
    borderColor: "border-red-500/30",
    pulseColor: "bg-red-500/20",
    title: "Generation Failed",
    description: "Something went wrong. Please try again or contact support.",
  },
};

/** Compact status badge for list views */
export function PDFStatusBadge({ status }: { status: PDFStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        status === "completed"
          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
          : status === "processing"
          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          : status === "pending"
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      }`}
    >
      {status === "processing" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span>
        {status === "completed" && "Ready"}
        {status === "processing" && "Generating..."}
        {status === "pending" && "Pending"}
        {status === "failed" && "Failed"}
      </span>
    </motion.div>
  );
}

export default function PDFStatusCard({
  status,
  downloadProgress = null,
  onGenerateClick,
  onDownloadClick,
  compact = false,
}: PDFStatusCardProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const currentStepIndex = STEPS.findIndex((s) => s.id === status);
  const isProcessing = status === "processing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border-2 ${config.borderColor} bg-gradient-to-br ${config.bgGradient} p-4 overflow-hidden`}
    >
      {/* Step progress indicator */}
      {!compact && status !== "failed" && (
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((step, idx) => {
            const isActive = step.id === status;
            const isPast = currentStepIndex > idx;
            const isFuture = currentStepIndex < idx;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isPast
                        ? "rgb(34 197 94)"
                        : isActive
                        ? "rgb(59 130 246)"
                        : "rgb(203 213 225)",
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isPast ? "bg-green-500" : isActive ? "bg-blue-500" : "bg-muted"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isActive && isProcessing ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    )}
                  </motion.div>
                  <span
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.shortLabel}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 max-w-[20px] mx-1 rounded ${
                      isPast ? "bg-green-500" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main status content */}
      <div className="flex items-start gap-3">
        <motion.div
          animate={
            isProcessing
              ? {
                  scale: [1, 1.05, 1],
                  opacity: [1, 0.8, 1],
                  transition: { repeat: Infinity, duration: 2 },
                }
              : {}
          }
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.pulseColor}`}
        >
          {isProcessing ? (
            <Loader2 className={`w-5 h-5 ${config.color} animate-spin`} />
          ) : (
            <Icon className={`w-5 h-5 ${config.color}`} />
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-0.5">{config.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{config.description}</p>

          {/* Processing sub-steps animation */}
          {isProcessing && "subSteps" in config && config.subSteps && !compact && (
            <div className="space-y-1.5 mb-3">
              {config.subSteps.map((subStep, idx) => (
                <motion.div
                  key={subStep}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.3 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      delay: idx * 0.2,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                  />
                  {subStep}
                </motion.div>
              ))}
            </div>
          )}

          {/* Actions */}
          {status === "pending" && onGenerateClick && (
            <Button size="sm" onClick={onGenerateClick} className="gap-2">
              <FileText className="w-4 h-4" />
              Generate PDF
            </Button>
          )}
          {status === "completed" && onDownloadClick && (
            <div className="space-y-2">
              <Button
                size="sm"
                onClick={onDownloadClick}
                disabled={downloadProgress != null}
                className="gap-2"
              >
                {downloadProgress != null ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {downloadProgress < 100
                      ? `Downloading ${downloadProgress}%`
                      : "Done"}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
              {downloadProgress != null && (
                <Progress value={downloadProgress} className="h-2 w-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
