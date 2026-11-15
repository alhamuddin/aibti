"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { CourseEditor } from "@/components/dashboard/courses/course-editor";

export function CourseCreation() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CourseEditor />
    </QueryClientProvider>
  );
}
