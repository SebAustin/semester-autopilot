import type { Course, Deliverable } from "../types";

/**
 * A deliverable's share of the course grade:
 * 1. explicit syllabus weight ("Midterm: 15%") wins;
 * 2. otherwise its category's weight split evenly across the category's items;
 * 3. otherwise 0 (unknown — rendered small, never invented).
 * Derived every call; never stored.
 */
export function effectiveWeightPct(
  deliverable: Deliverable,
  course: Course,
  courseDeliverables: Deliverable[],
): number {
  if (deliverable.weightPct !== undefined) return deliverable.weightPct;

  if (deliverable.categoryId) {
    const category = course.grading.categories.find(
      (c) => c.id === deliverable.categoryId,
    );
    if (category) {
      const itemsInCategory = courseDeliverables.filter(
        (d) => d.categoryId === deliverable.categoryId,
      ).length;
      return category.weight / Math.max(1, itemsInCategory);
    }
  }

  return 0;
}
