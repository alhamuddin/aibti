"use client";

import {
  createColumnHelper,
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

export type AttendanceTableRow = {
  id: string;
  href: string;
  courseName: string;
  batchName: string;
  courseDate: string;
  timeZone: string;
  firstClassTime: string;
  classCount: number;
  presentCount: number;
  absentCount: number;
  enrolledCount: number;
  status: string;
  details: ReactNode;
};

const attendanceFeatures = tableFeatures({
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const columnHelper = createColumnHelper<typeof attendanceFeatures, AttendanceTableRow>();
const columns = columnHelper.columns([
  columnHelper.accessor("courseName", {
    header: "Course",
    cell: ({ row }) => (
      <div className="min-w-48">
        <Link
          href={row.original.href}
          className="text-card-foreground hover:text-primary font-semibold hover:underline"
        >
          {row.original.courseName}
        </Link>
        <p className="text-muted-foreground mt-1 text-xs">{row.original.batchName}</p>
      </div>
    ),
  }),
  columnHelper.accessor("courseDate", {
    header: "Date and time",
    cell: ({ row }) => (
      <div>
        <p className="text-card-foreground">{row.original.courseDate}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {row.original.firstClassTime} · {row.original.timeZone}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("presentCount", {
    header: "Attendance",
    cell: ({ row }) => (
      <div className="tabular-nums">
        <p className="text-card-foreground font-medium">
          {row.original.presentCount} present · {row.original.absentCount} absent
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{row.original.enrolledCount} enrolled</p>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <span className="bg-muted text-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
        {getValue()}
      </span>
    ),
  }),
]);

export function AttendanceTable({ rows }: { rows: AttendanceTableRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const table = useTable({
    features: attendanceFeatures,
    columns,
    data: rows,
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
  });
  const pageRows = table.getRowModel().rows;
  const pageIndex = table.state.pagination.pageIndex;
  const pageSize = table.state.pagination.pageSize;
  const rowCount = table.getRowCount();
  const firstRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <h2 className="text-card-foreground font-semibold">Scheduled attendance</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            {rowCount.toLocaleString()} course sessions · 20 per page
          </p>
        </div>
      </div>

      {pageRows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th scope="col" key={header.id} className="px-4 py-3 font-semibold sm:px-5">
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                    Details
                  </th>
                </tr>
              ))}
            </thead>
            <tbody className="divide-border divide-y">
              {pageRows.map((row) => {
                const isExpanded = expandedId === row.original.id;
                return (
                  <FragmentRows
                    key={row.id}
                    row={row}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : row.original.id)}
                    table={table}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-muted-foreground px-5 py-12 text-center text-sm">
          No scheduled attendance sessions found.
        </p>
      )}

      <footer className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
        <p className="text-muted-foreground text-xs">
          Showing {firstRow}–{lastRow} of {rowCount.toLocaleString()}
        </p>
        <nav aria-label="Attendance table pages" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-border text-foreground hover:bg-accent inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold disabled:pointer-events-none disabled:opacity-50"
          >
            <ChevronLeft aria-hidden="true" className="size-4" /> Previous
          </button>
          <span className="text-muted-foreground min-w-20 text-center text-xs tabular-nums">
            Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-border text-foreground hover:bg-accent inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-xs font-semibold disabled:pointer-events-none disabled:opacity-50"
          >
            Next <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      </footer>
    </section>
  );
}

function FragmentRows({
  row,
  isExpanded,
  onToggle,
  table,
}: {
  row: ReturnType<
    ReturnType<typeof useTable<typeof attendanceFeatures, AttendanceTableRow>>["getRowModel"]
  >["rows"][number];
  isExpanded: boolean;
  onToggle: () => void;
  table: ReturnType<typeof useTable<typeof attendanceFeatures, AttendanceTableRow>>;
}) {
  return (
    <>
      <tr className="hover:bg-muted/30 align-top">
        {row.getAllCells().map((cell) => (
          <td key={cell.id} className="px-4 py-4 sm:px-5">
            <table.FlexRender cell={cell} />
          </td>
        ))}
        <td className="px-4 py-4 sm:px-5">
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={onToggle}
            className="text-primary hover:bg-primary/10 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold"
          >
            {isExpanded ? "Hide details" : "Manage"}
            {isExpanded ? (
              <ChevronUp aria-hidden="true" className="size-4" />
            ) : (
              <ChevronDown aria-hidden="true" className="size-4" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded ? (
        <tr className="bg-muted/20">
          <td colSpan={row.getAllCells().length + 1} className="p-4 sm:p-5">
            {row.original.details}
          </td>
        </tr>
      ) : null}
    </>
  );
}
