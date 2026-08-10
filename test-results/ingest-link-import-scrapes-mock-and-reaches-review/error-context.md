# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ingest.spec.ts >> link import scrapes (mock) and reaches review
- Location: e2e/ingest.spec.ts:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/review what the AI read/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/review what the AI read/i)

```

```yaml
- banner:
  - navigation "Main navigation":
    - link "Semester Autopilot":
      - /url: /
    - link "Semester":
      - /url: /app
    - link "Add courses":
      - /url: /app/ingest
    - link "Planner":
      - /url: /app/planner
- main:
  - paragraph: Review what the AI found
  - heading "Your call on every row." [level=1]
  - paragraph: Amber rows are the AI admitting it wasn't sure — the original syllabus wording is shown so you can fix them in seconds.
  - region "Course":
    - text: Course code
    - textbox "Course code":
      - /placeholder: CS 3110
      - text: CS 3110
    - text: Title
    - textbox "Title":
      - /placeholder: Data Structures and Functional Programming
      - text: Data Structures and Functional Programming
  - region "Grading weights":
    - heading "Grading" [level=2]
    - text: Σ 100%
    - list:
      - listitem:
        - textbox "Category 1 name": Problem Sets
        - spinbutton "Problem Sets weight percent": "30"
        - text: "%"
      - listitem:
        - textbox "Category 2 name": Prelim 1
        - spinbutton "Prelim 1 weight percent": "15"
        - text: "%"
      - listitem:
        - textbox "Category 3 name": Prelim 2
        - spinbutton "Prelim 2 weight percent": "15"
        - text: "%"
      - listitem:
        - textbox "Category 4 name": Final Exam
        - spinbutton "Final Exam weight percent": "25"
        - text: "%"
      - listitem:
        - textbox "Category 5 name": Programming Project
        - spinbutton "Programming Project weight percent": "10"
        - text: "%"
      - listitem:
        - textbox "Category 6 name": Participation
        - spinbutton "Participation weight percent": "5"
        - text: "%"
  - region "Deliverables":
    - heading "Deliverables" [level=2]
    - list:
      - listitem:
        - textbox "Deliverable title": PS1
        - paragraph: "syllabus says: “due Fri Sep 4”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-09-04
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS1": Remove
      - listitem:
        - textbox "Deliverable title": PS2
        - paragraph: "syllabus says: “due Fri Sep 18”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-09-18
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS2": Remove
      - listitem:
        - textbox "Deliverable title": PS3
        - paragraph: "syllabus says: “due Fri Oct 2”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-10-02
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS3": Remove
      - listitem:
        - textbox "Deliverable title": Prelim 1
        - paragraph: "syllabus says: “Thursday, October 8, 7:30pm (Uris Hall Auditorium)”"
        - combobox "Deliverable type":
          - option "assignment"
          - option "quiz"
          - option "exam" [selected]
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-10-08
        - spinbutton "Estimated hours of work": "8"
        - text: h
        - button "Remove Prelim 1": Remove
      - listitem:
        - textbox "Deliverable title": PS4
        - paragraph: "syllabus says: “due Fri Oct 23”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-10-23
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS4": Remove
      - listitem:
        - textbox "Deliverable title": Prelim 2
        - paragraph: "syllabus says: “Thursday, November 5, 7:30pm”"
        - combobox "Deliverable type":
          - option "assignment"
          - option "quiz"
          - option "exam" [selected]
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-11-05
        - spinbutton "Estimated hours of work": "8"
        - text: h
        - button "Remove Prelim 2": Remove
      - listitem:
        - textbox "Deliverable title": PS5
        - paragraph: "syllabus says: “due Fri Nov 13”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-11-13
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS5": Remove
      - listitem:
        - textbox "Deliverable title": PS6
        - paragraph: "syllabus says: “due Fri Dec 4”"
        - combobox "Deliverable type":
          - option "assignment" [selected]
          - option "quiz"
          - option "exam"
          - option "project"
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-12-04
        - spinbutton "Estimated hours of work": "3"
        - text: h
        - button "Remove PS6": Remove
      - listitem:
        - textbox "Deliverable title": Final project
        - paragraph: "syllabus says: “Wednesday, December 9, 11:59pm”"
        - combobox "Deliverable type":
          - option "assignment"
          - option "quiz"
          - option "exam"
          - option "project" [selected]
          - option "paper"
          - option "presentation"
          - option "reading"
          - option "other"
        - textbox "Due date": 2026-12-09
        - spinbutton "Estimated hours of work": "10"
        - text: h
        - button "Remove Final project": Remove
    - region "Needs a date":
      - heading "Needs a date — the AI wouldn't guess" [level=3]
      - list:
        - listitem:
          - textbox "Deliverable title": Project milestone (design doc)
          - paragraph: "syllabus says: “Week of Nov 16”"
          - combobox "Deliverable type":
            - option "assignment"
            - option "quiz"
            - option "exam"
            - option "project" [selected]
            - option "paper"
            - option "presentation"
            - option "reading"
            - option "other"
          - textbox "Due date"
          - spinbutton "Estimated hours of work": "10"
          - text: h
          - button "Remove Project milestone (design doc)": Remove
        - listitem:
          - textbox "Deliverable title": Final Exam
          - paragraph: "syllabus says: “date TBD (registrar schedules finals in November)”"
          - combobox "Deliverable type":
            - option "assignment"
            - option "quiz"
            - option "exam" [selected]
            - option "project"
            - option "paper"
            - option "presentation"
            - option "reading"
            - option "other"
          - textbox "Due date"
          - spinbutton "Estimated hours of work": "8"
          - text: h
          - button "Remove Final Exam": Remove
  - region "Extraction warnings":
    - paragraph: The AI flagged
    - list:
      - listitem: The lowest problem set score is dropped — not reflected in weights.
      - listitem: Participation (5%) has no dated deliverables.
  - paragraph: 9 dated deliverables ready · 2 still need a date
  - button "Discard"
  - button "Add to my semester"
- alert
```

# Test source

```ts
  1  | import path from "node:path";
  2  | 
  3  | import { expect, test } from "@playwright/test";
  4  | 
  5  | test("link import scrapes (mock) and reaches review", async ({ page }) => {
  6  |   await page.goto("/app/ingest");
  7  |   await page
  8  |     .getByLabel("Course page URL")
  9  |     .fill("https://cs.example.edu/courses/3110");
  10 |   await page.getByRole("button", { name: "Import" }).click();
> 11 |   await expect(page.getByText(/review what the AI read/i)).toBeVisible({
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  12 |     timeout: 15_000,
  13 |   });
  14 |   await expect(page.getByText(/dated deliverables ready/)).toBeVisible();
  15 | });
  16 | 
  17 | const REVIEW_HEADING = /your call on every row/i;
  18 | 
  19 | test("paste → review → commit adds the course to the semester", async ({
  20 |   page,
  21 | }) => {
  22 |   await page.goto("/app/ingest");
  23 | 
  24 |   await page
  25 |     .getByLabel(/paste the syllabus text/i)
  26 |     .fill(
  27 |       "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelims 30%, Final 25%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8.",
  28 |     );
  29 |   await page.getByRole("button", { name: "Extract deadlines" }).click();
  30 | 
  31 |   // Mocked extraction (LLM_MOCK=1) returns the CS 3110 fixture payload.
  32 |   await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
  33 |     timeout: 15_000,
  34 |   });
  35 | 
  36 |   // Honesty UX: null-dated rows are quarantined with the verbatim source text.
  37 |   await expect(page.getByText(/Week of Nov 16/i)).toBeVisible();
  38 |   await expect(page.getByText(/9 dated deliverables ready/)).toBeVisible();
  39 |   await expect(page.getByText(/2 still need a date/)).toBeVisible();
  40 | 
  41 |   await page.getByRole("button", { name: "Add to my semester" }).click();
  42 | 
  43 |   await expect(page).toHaveURL(/\/app$/);
  44 |   await expect(page.getByText("CS 3110").first()).toBeVisible();
  45 | });
  46 | 
  47 | test("PDF upload runs pdf.js in the browser and reaches review", async ({
  48 |   page,
  49 | }) => {
  50 |   await page.goto("/app/ingest");
  51 | 
  52 |   await page
  53 |     .locator('input[type="file"]')
  54 |     .setInputFiles(path.resolve("fixtures", "cs-3110-syllabus.pdf"));
  55 | 
  56 |   await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
  57 |     timeout: 20_000,
  58 |   });
  59 | });
  60 | 
  61 | test("editing a needs-a-date row promotes it into the dated list", async ({
  62 |   page,
  63 | }) => {
  64 |   await page.goto("/app/ingest");
  65 |   await page
  66 |     .getByLabel(/paste the syllabus text/i)
  67 |     .fill(
  68 |       "CS 3110 Data Structures. Grading: Problem Sets 30%, Prelims 30%, Final 25%. PS1 due Fri Sep 4. Prelim 1: Thursday, October 8.",
  69 |     );
  70 |   await page.getByRole("button", { name: "Extract deadlines" }).click();
  71 |   await expect(page.getByRole("heading", { name: REVIEW_HEADING })).toBeVisible({
  72 |     timeout: 15_000,
  73 |   });
  74 | 
  75 |   const needsDate = page.getByRole("region", { name: "Needs a date" });
  76 |   await expect(needsDate.getByLabel("Due date")).toHaveCount(2);
  77 | 
  78 |   // Give the first undated row (the project milestone) a real date;
  79 |   // it should leave the amber bucket.
  80 |   await needsDate.getByLabel("Due date").first().fill("2026-11-18");
  81 | 
  82 |   await expect(page.getByText(/10 dated deliverables ready/)).toBeVisible();
  83 |   await expect(page.getByText(/1 still needs? a date/)).toBeVisible();
  84 | });
  85 | 
```