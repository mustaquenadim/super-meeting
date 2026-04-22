"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@/lib/api/types";

interface LocationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  onEdit: (location: Location) => void;
}

export default function LocationViewDialog({
  open,
  onOpenChange,
  location,
  onEdit,
}: LocationViewDialogProps) {
  const t = useTranslations("locations");
  if (!location) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{location.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {location.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{location.address}</span>
            </div>
          )}
          {location.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{location.phone}</span>
            </div>
          )}
          {location.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{location.email}</span>
            </div>
          )}
          {(location.latitude || location.longitude) && (
            <div className="text-sm text-muted-foreground">
              {location.latitude && location.longitude
                ? t("coordinates", {
                    lat: location.latitude,
                    lng: location.longitude,
                  })
                : location.latitude
                  ? t("latitudeLabel", { lat: location.latitude })
                  : t("longitudeLabel", { lng: location.longitude ?? "" })}
            </div>
          )}
          <div>
            <Badge
              variant={location.status === "active" ? "default" : "secondary"}
            >
              {location.status === "active" ? t("statusActive") : t("statusInactive")}
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button onClick={() => onEdit(location)}>{t("edit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
