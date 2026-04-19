"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface LocationFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  status: "active" | "inactive";
}

interface LocationFormProps {
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: LocationFormData;
  setFormData: React.Dispatch<React.SetStateAction<LocationFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export default function LocationForm({
  mode,
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isSubmitting,
}: LocationFormProps) {
  const update = (key: keyof LocationFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Location" : "Edit Location"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Location name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Full address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Email address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder="Latitude"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder="Longitude"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="status">Status</Label>
              <p className="text-sm text-muted-foreground">
                {formData.status === "active"
                  ? "Location is active and visible"
                  : "Location is inactive and hidden"}
              </p>
            </div>
            <Switch
              id="status"
              checked={formData.status === "active"}
              onCheckedChange={(checked) =>
                update("status", checked ? "active" : "inactive")
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
