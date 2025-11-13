"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Address {
  id: number;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  address_type: 'home' | 'work' | 'other';
  is_postal: boolean;
  is_permanent: boolean;
}

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: Address | null;
  onSuccess: () => void;
}

export default function AddressFormModal({
  isOpen,
  onClose,
  address,
  onSuccess,
}: AddressFormModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    address_line_1: "",
    address_line_2: "",
    landmark: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
    address_type: "home" as 'home' | 'work' | 'other',
    is_postal: false,
    is_permanent: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        address_line_1: address.address_line_1 || "",
        address_line_2: address.address_line_2 || "",
        landmark: address.landmark || "",
        city: address.city || "",
        state: address.state || "",
        country: address.country || "India",
        postal_code: address.postal_code || "",
        address_type: address.address_type || "home",
        is_postal: address.is_postal || false,
        is_permanent: address.is_permanent || false,
      });
    } else {
      setFormData({
        address_line_1: "",
        address_line_2: "",
        landmark: "",
        city: "",
        state: "",
        country: "India",
        postal_code: "",
        address_type: "home",
        is_postal: false,
        is_permanent: false,
      });
    }
  }, [address, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.address_line_1.trim()) {
      toast({
        title: "Validation Error",
        description: "Address line 1 is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.state.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.postal_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Postal code is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.country.trim()) {
      toast({
        title: "Validation Error",
        description: "Country is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (address) {
        // Update existing address
        const response = await apiClient.updateAddress(address.id, formData);
        if (response.error) {
          throw new Error(response.error);
        }
        toast({
          title: "Address updated",
          description: "Your address has been updated successfully.",
        });
      } else {
        // Create new address
        const response = await apiClient.createAddress(formData);
        if (response.error) {
          throw new Error(response.error);
        }
        toast({
          title: "Address added",
          description: "Your address has been added successfully.",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {address ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line_1">
              Address Line 1 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address_line_1"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleChange}
              placeholder="Street address, P.O. box"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2</Label>
            <Input
              id="address_line_2"
              name="address_line_2"
              value={formData.address_line_2}
              onChange={handleChange}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark</Label>
            <Input
              id="landmark"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="Nearby landmark"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">
                Postal Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Postal code"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_type">Address Type</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value: 'home' | 'work' | 'other') =>
                setFormData((prev) => ({ ...prev, address_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_permanent"
                checked={formData.is_permanent}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("is_permanent", checked as boolean)
                }
              />
              <Label
                htmlFor="is_permanent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Set as default address
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_postal"
                checked={formData.is_postal}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("is_postal", checked as boolean)
                }
              />
              <Label
                htmlFor="is_postal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use as postal address
              </Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Address"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

