import { useParams } from "next/navigation";
import { Id } from "../../convex/_generated/dataModel";

export function useCourseId() {
  const { courseId } = useParams();
  return courseId as Id<"courses">;
}
