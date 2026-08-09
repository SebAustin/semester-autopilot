import { EmptyState } from "@/components/shared/EmptyState";

export default function IngestPage() {
  return (
    <EmptyState
      kicker="Add courses"
      headline="Syllabus in, semester out."
      body="PDF upload, paste, and course-page import land here next. For now, load the demo semester from the home tab."
    />
  );
}
