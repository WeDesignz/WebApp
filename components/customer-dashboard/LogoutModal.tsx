"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Always redirect to login, even if API call failed
      // Local auth data is cleared regardless
      toast.success("Logged out successfully");
      router.push("/auth/login");
      onClose();
    } catch (error) {
      // Even if logout throws an error, we should still redirect
      // The logout function always clears local data
      router.push("/auth/login");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-2xl">Confirm Logout</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            Are you sure you want to logout? You'll need to sign in again to access your account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Any unsaved changes will be lost. Make sure to save your work before logging out.
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

