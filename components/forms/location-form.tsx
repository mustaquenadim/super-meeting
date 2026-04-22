"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("locations");
  const update = (key: keyof LocationFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? t("addLocation") : t("editLocation")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("form.name")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t("form.namePlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t("form.address")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder={t("form.addressPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("form.phone")}</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder={t("form.phonePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("form.email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t("form.emailPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t("form.latitude")}</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => update("latitude", e.target.value)}
                placeholder={t("form.latitude")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{t("form.longitude")}</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => update("longitude", e.target.value)}
                placeholder={t("form.longitude")}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="status">{t("status")}</Label>
              <p className="text-sm text-muted-foreground">
                {formData.status === "active"
                  ? t("form.statusDescriptionActive")
                  : t("form.statusDescriptionInactive")}
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
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : mode === "add" ? t("add") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
