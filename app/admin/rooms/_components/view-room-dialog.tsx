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
                Location
              </p>
              <p className="text-sm">{room.branch.name}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Doors</p>
            <p className="text-sm">{doorsList}</p>
          </div>
          {room.capacity != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Capacity
              </p>
              <p className="text-sm">{room.capacity} people</p>
            </div>
          )}
          {room.type && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Category
              </p>
              <p className="text-sm">{room.type}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <Badge
              className="capitalize"
              variant={room.status === "available" ? "default" : "secondary"}
            >
              {room.status}
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => onEdit(room)}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
