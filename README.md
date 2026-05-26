# LearnVault

A course-learning platform built with React, TypeScript, and Vite.

## Getting Started

```bash
npm install
npm run dev
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── components/
│   ├── LessonContent.tsx     # Renders lesson title, type, duration, body
│   ├── LessonSidebar.tsx     # Sidebar with full lesson list + progress indicators
│   └── MilestoneForm.tsx     # Submission form for milestone-type lessons
├── context/
│   └── ProgressContext.tsx   # Global progress state (completions + submissions)
├── data/
│   └── courses.ts            # Static course/lesson data
├── pages/
│   ├── CourseList.tsx        # Home page — lists all courses
│   └── LessonView.tsx        # Main lesson page (sidebar + content + navigation)
├── test/
│   ├── LessonView.test.tsx   # Full test suite for LessonView
│   └── setup.ts              # Vitest + jest-dom setup
└── types/
    └── index.ts              # Shared TypeScript types
```

## Test Coverage

`LessonView.test.tsx` covers all 7 required scenarios:

| # | Scenario | Tests |
|---|----------|-------|
| 1 | Lesson content renders correctly | Title, body, duration, type badge, layout |
| 2 | Navigation to next/previous lesson works | Buttons present/absent, labels, click navigation |
| 3 | Sidebar shows correct lesson list | All lessons listed, correct links, milestone badge |
| 4 | Current lesson is highlighted in sidebar | `aria-current`, CSS modifier class, updates on nav |
| 5 | Progress marked complete after finishing | Mark-complete button, badge, sidebar ✓ icon |
| 6 | Final lesson shows completion CTA | CTA visibility, heading, course title, browse link |
| 7 | Milestone submission form on milestone lessons | Form present, textarea, submit, validation, success |
