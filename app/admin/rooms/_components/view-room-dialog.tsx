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
import { Badge } from "@/components/ui/badge";
import type { RoomViewModel } from "@/lib/api/types";

interface ViewRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: RoomViewModel | null;
  onEdit: (room: RoomViewModel) => void;
}

export function ViewRoomDialog({
  open,
  onOpenChange,
  room,
  onEdit,
}: ViewRoomDialogProps) {
  const t = useTranslations("rooms");
  if (!room) return null;

  const doorsList =
    room.doors && room.doors.length > 0
      ? room.doors.map((d) => d.name).join(", ")
      : room.door?.name ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{room.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {room.branch?.name && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("form.branch")}
              </p>
              <p className="text-sm">{room.branch.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("form.doors")}</p>
            <p className="text-sm">{doorsList}</p>
          </div>
          {room.capacity != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("form.capacity")}
              </p>
              <p className="text-sm">{t("peopleCount", { count: room.capacity })}</p>
            </div>
          )}
          {room.type && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t("table.category")}
              </p>
              <p className="text-sm">{room.type}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">{t("status")}</p>
            <Badge
              className="capitalize"
              variant={room.status === "available" ? "default" : "secondary"}
            >
              {room.status === "available" ? t("available") : t("unavailable")}
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button onClick={() => onEdit(room)}>{t("editRoom")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
