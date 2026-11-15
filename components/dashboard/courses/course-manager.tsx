"use client";

import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createColumnHelper,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Column,
  type PaginationState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, BookOpenCheck, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { deleteCourseAction, publishCourseAction } from "@/actions/course-actions";
import type { CourseListResponse, CourseRow } from "@/lib/course-types";
import { isCourseOngoing } from "@/lib/course-status";

const pageSize = 20;
const emptyCourses: CourseRow[] = [];
const features = tableFeatures({
  rowPaginationFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});
const columnHelper = createColumnHelper<typeof features, CourseRow>();

const columns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: ({ column }) => <SortButton column={column} label="Course" />,
    cell: ({ row }) => (
      <div className="min-w-52">
        <Link
          href={`/dashboard/courses/${row.original.id}`}
          className="text-card-foreground hover:text-primary font-semibold hover:underline"
        >
          {row.original.title}
        </Link>
        <p className="text-muted-foreground mt-1 line-clamp-2 max-w-lg text-xs leading-5">
          {row.original.description}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => <SortButton column={column} label="Status" />,
    cell: ({ getValue, row }) => (
      <span className="bg-secondary text-secondary-foreground inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
        {getValue() === "PUBLISHED" ? "Published" : getValue().toLowerCase()}
        {row.original.isMock ? " · Mock" : ""}
      </span>
    ),
  }),
  columnHelper.accessor("category", {
    header: "Category",
    cell: ({ getValue }) => getValue() || "—",
  }),
  columnHelper.accessor("durationDays", {
    header: ({ column }) => <SortButton column={column} label="Duration" />,
    cell: ({ getValue }) => (getValue() ? `${getValue()} days` : "—"),
  }),
  columnHelper.accessor((course) => course.subjects.length, {
    id: "subjects",
    header: "Subjects",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor((course) => course.batches.length, {
    id: "batches",
    header: "Batches",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor(
    (course) => course.batches.reduce((total, batch) => total + batch.enrollments.length, 0),
    {
      id: "participants",
      header: "Participants",
      cell: ({ row, getValue }) => `${getValue()} / ${row.original.capacity ?? "—"}`,
    },
  ),
]);

function SortButton<TValue>({
  column,
  label,
}: {
  column: Column<typeof features, CourseRow, TValue>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="hover:text-foreground inline-flex items-center gap-1.5"
    >
      {label}
      <Icon aria-hidden="true" className="size-3.5" />
    </button>
  );
}

function CourseManagerContent({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize });
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const query = useQuery({
    queryKey: ["courses", search, pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: search,
        page: String(pagination.pageIndex + 1),
        pageSize: String(pagination.pageSize),
      });
      const response = await fetch(`/api/courses?${params}`, { cache: "no-store" });
      const result = (await response.json()) as CourseListResponse & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Could not load courses.");
      return result;
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  function showResult(result: { success: boolean; message: string }) {
    setNotice(result.message);
    setNoticeIsError(!result.success);
    if (result.success) void queryClient.invalidateQueries({ queryKey: ["courses"] });
  }

  const publishMutation = useMutation({ mutationFn: publishCourseAction, onSuccess: showResult });
  const deleteMutation = useMutation({ mutationFn: deleteCourseAction, onSuccess: showResult });
  const mutationPending = publishMutation.isPending || deleteMutation.isPending;
  const courses = query.data?.courses ?? emptyCourses;
  const table = useTable({
    features,
    columns,
    data: courses,
    getRowId: (course) => course.id,
    state: { pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    rowCount: query.data?.total ?? 0,
  });

  function submitCourseAction(action: typeof publishCourseAction, courseId: string) {
    const formData = new FormData();
    formData.set("courseId", courseId);
    if (action === publishCourseAction) publishMutation.mutate(formData);
    else deleteMutation.mutate(formData);
  }

  function deleteCourse(course: CourseRow) {
    if (
      window.confirm(
        `Permanently delete "${course.title}" and its classes, materials, and active assignments? Audit history will be retained.`,
      )
    ) {
      submitCourseAction(deleteCourseAction, course.id);
    }
  }

  const rows = table.getRowModel().rows;
  const ongoingRows = rows.filter((row) => isCourseOngoing(row.original));
  const publishedRows = rows.filter(
    (row) => row.original.status === "PUBLISHED" && !isCourseOngoing(row.original),
  );
  const otherRows = rows.filter((row) => row.original.status !== "PUBLISHED");
  const renderRows = (sectionRows: typeof rows) =>
    sectionRows.map((row) => {
      const course = row.original;
      return (
        <tr key={row.id} className="align-top">
          {row.getAllCells().map((cell) => (
            <td key={cell.id} className="text-muted-foreground px-4 py-3.5">
              <table.FlexRender cell={cell} />
            </td>
          ))}
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/courses/${course.id}`}
                className="text-primary text-xs font-semibold hover:underline"
              >
                Open
              </Link>
              {canManage && !course.isMock ? (
                <>
                  {course.status === "DRAFT" ? (
                    <button
                      type="button"
                      disabled={mutationPending}
                      onClick={() => submitCourseAction(publishCourseAction, course.id)}
                      className="text-primary inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                    >
                      <Send aria-hidden="true" className="size-3.5" /> Publish
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={mutationPending}
                    onClick={() => deleteCourse(course)}
                    className="text-destructive inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" /> Delete
                  </button>
                </>
              ) : null}
            </div>
          </td>
        </tr>
      );
    });
  const renderSection = (title: string, sectionRows: typeof rows, emptyMessage: string) => (
    <Fragment key={title}>
      <tr className="bg-muted/40">
        <th
          scope="rowgroup"
          colSpan={7}
          className="text-card-foreground border-border border-y px-4 py-3 text-left text-sm font-semibold"
        >
          {title}
          <span className="text-muted-foreground ml-2 text-xs font-normal">
            {sectionRows.length}
          </span>
        </th>
      </tr>
      {sectionRows.length ? (
        renderRows(sectionRows)
      ) : (
        <tr>
          <td colSpan={7} className="text-muted-foreground px-5 py-5 text-sm">
            {emptyMessage}
          </td>
        </tr>
      )}
    </Fragment>
  );

  return (
    <div className="space-y-5">
      {canManage ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Open any course for its full schedule, materials, and management controls.
          </p>
          <Link
            href="/dashboard/courses/new"
            className="bg-primary text-primary-foreground inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
          >
            <Plus aria-hidden="true" className="size-4" />
            Create course
          </Link>
        </div>
      ) : null}
      {notice ? (
        <p
          role={noticeIsError ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            noticeIsError
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/20 bg-accent text-accent-foreground"
          }`}
        >
          {notice}
        </p>
      ) : null}
      <section className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-card-foreground text-sm font-semibold">Course catalogue</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {query.data ? `${query.data.total.toLocaleString()} course(s)` : "Loading courses…"}
            </p>
          </div>
          <label className="text-muted-foreground text-xs">
            <span className="sr-only">Search courses</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.currentTarget.value);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              placeholder="Search courses"
              className="border-input bg-background text-foreground min-h-9 w-56 rounded-md border px-3 text-sm"
            />
          </label>
        </div>
        {query.isError ? (
          <div role="alert" className="text-destructive px-5 py-8 text-sm">
            {query.error.message}
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="text-primary ml-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/70 text-muted-foreground text-xs uppercase">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th key={header.id} scope="col" className="px-4 py-3 font-semibold">
                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Actions
                    </th>
                  </tr>
                ))}
              </thead>
              <tbody className="divide-border divide-y">
                {query.isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-muted-foreground px-5 py-12 text-center">
                      Loading courses…
                    </td>
                  </tr>
                ) : null}
                {!query.isLoading && courses.length > 0 ? (
                  <>
                    {renderSection(
                      "Ongoing courses",
                      ongoingRows,
                      "No ongoing courses on this page.",
                    )}
                    {renderSection(
                      "Published courses",
                      publishedRows,
                      "No other published courses on this page.",
                    )}
                    {otherRows.length ? renderSection("Drafts and archived", otherRows, "") : null}
                  </>
                ) : null}
                {!query.isLoading && courses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <BookOpenCheck
                        aria-hidden="true"
                        className="text-muted-foreground mx-auto size-8"
                      />
                      <p className="text-card-foreground mt-3 font-semibold">No courses to show</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {search
                          ? "Try a different search."
                          : "Courses will appear here when available to your role."}
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
        {query.data ? (
          <div className="border-border flex items-center justify-between gap-4 border-t px-4 py-3">
            <button
              type="button"
              disabled={!table.getCanPreviousPage() || query.isFetching}
              onClick={() => table.previousPage()}
              className="text-primary disabled:text-muted-foreground text-sm font-semibold"
            >
              Previous
            </button>
            <span className="text-muted-foreground text-xs">
              Page {pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <button
              type="button"
              disabled={!table.getCanNextPage() || query.isFetching}
              onClick={() => table.nextPage()}
              className="text-primary disabled:text-muted-foreground text-sm font-semibold"
            >
              Next
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function CourseManager({ canManage }: { canManage: boolean }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <CourseManagerContent canManage={canManage} />
    </QueryClientProvider>
  );
}
