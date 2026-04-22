"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalItems,
  startIndex,
  endIndex,
  itemLabel,
  onPageChange,
  onRowsPerPageChange,
}: DataTablePaginationProps) {
  const t = useTranslations("common.pagination");
  const [pageInput, setPageInput] = React.useState(currentPage.toString());

  React.useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) setPageInput(value);
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInput, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      setPageInput(currentPage.toString());
    } else if (pageNum > totalPages) {
      setPageInput(totalPages.toString());
      onPageChange(totalPages);
    } else if (pageNum !== currentPage) {
      onPageChange(pageNum);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3">
      <div className="text-sm text-muted-foreground">
        {t("showing", {
          start: startIndex + 1,
          end: Math.min(endIndex, totalItems),
          total: totalItems,
          label: itemLabel || t("items"),
        })}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            {t("rowsPerPage")}
          </Label>
          <Select
            value={rowsPerPage.toString()}
            onValueChange={(value) => {
              onRowsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger id="rows-per-page" size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="page-input"
              className="text-sm font-medium whitespace-nowrap"
            >
              {t("page")}
            </Label>
            <Input
              id="page-input"
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="h-8 w-16 text-center text-sm"
              inputMode="numeric"
            />
            <span className="text-sm font-medium whitespace-nowrap">
              {t("of", { total: totalPages })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">{t("first")}</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">{t("previous")}</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">{t("next")}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">{t("last")}</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
