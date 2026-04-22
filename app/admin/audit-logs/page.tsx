"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Activity, Pause, Play, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cvSecurityMonitorEventKey } from "@/lib/cvsecurity/fetch-transaction-monitor";
import { useCvSecurityAuditMonitor } from "@/lib/hooks";

const POLL_MS = 10_000;
const MAX_ROWS = 500;

export default function AuditLogsPage() {
  const t = useTranslations("auditLogs");
  const {
    events,
    isLoading,
    error,
    isPaused,
    setPaused,
    lastUpdatedAt,
    pollCount,
  } = useCvSecurityAuditMonitor({ pollMs: POLL_MS, maxRows: MAX_ROWS });

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("description", {
              endpoint: "/api/transaction/monitor",
              interval: POLL_MS / 1000,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="audit-pause"
              checked={!isPaused}
              onCheckedChange={(on) => setPaused(!on)}
            />
            <Label htmlFor="audit-pause" className="text-sm">
              {t("liveUpdates")}
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setPaused((p) => !p)}
          >
            {isPaused ? (
              <>
                <Play className="size-3.5" />
                {t("resume")}
              </>
            ) : (
              <>
                <Pause className="size-3.5" />
                {t("pause")}
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="size-4 text-muted-foreground" />
              {t("streamTitle")}
            </CardTitle>
            <CardDescription>
              {lastUpdatedAt
                ? t("lastPoll", {
                    time: lastUpdatedAt.toLocaleTimeString(),
                    count: pollCount,
                  })
                : isLoading
                  ? t("connecting")
                  : t("waiting")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && events.length === 0 ? (
              <Badge variant="secondary" className="gap-1">
                <Activity className="size-3 animate-pulse" />
                {t("loading")}
              </Badge>
            ) : isPaused ? (
              <Badge variant="outline">{t("paused")}</Badge>
            ) : (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600/90">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/60 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-white" />
                </span>
                {t("live")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : events.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-sm">
              {t("noEvents")}
            </p>
          ) : (
            <ScrollArea className="h-[min(70vh,640px)] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">{t("table.time")}</TableHead>
                    <TableHead>{t("table.event")}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {t("table.person")}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      {t("table.area")}
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      {t("table.reader")}
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {t("table.device")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={cvSecurityMonitorEventKey(e)}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {e.eventTime ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm">
                        {e.eventName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {[e.pin, e.name, e.lastName]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {e.areaName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell max-w-[200px] truncate text-sm text-muted-foreground">
                        {e.readerName ?? e.eventPointName ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell max-w-[180px] truncate text-xs text-muted-foreground">
                        {e.devName ?? e.devSn ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
