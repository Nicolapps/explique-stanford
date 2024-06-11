import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export function useCourseSlug() {
  const { courseSlug } = useParams();
  return courseSlug as Id<"courses">;
}
