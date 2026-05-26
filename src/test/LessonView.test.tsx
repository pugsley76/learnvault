/**
 * LessonView page tests
 *
 * Covers:
 *  1. Lesson content renders correctly
 *  2. Navigation to next/previous lesson works
 *  3. Sidebar shows correct lesson list
 *  4. Current lesson is highlighted in sidebar
 *  5. Progress is marked complete after finishing lesson
 *  6. Final lesson shows completion CTA
 *  7. Milestone submission form renders on milestone lessons
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ProgressProvider } from '@/context/ProgressContext'
import { LessonView } from '@/pages/LessonView'
import { SAMPLE_COURSE } from '@/data/courses'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COURSE_ID = SAMPLE_COURSE.id
const LESSONS = [...SAMPLE_COURSE.lessons].sort((a, b) => a.order - b.order)

/** First regular (non-milestone) lesson */
const FIRST_LESSON = LESSONS[0]
/** Second lesson */
const SECOND_LESSON = LESSONS[1]
/** The milestone lesson */
const MILESTONE_LESSON = LESSONS.find((l) => l.type === 'milestone')!
/** Last lesson in the course */
const LAST_LESSON = LESSONS[LESSONS.length - 1]

/**
 * Renders LessonView inside a MemoryRouter + ProgressProvider so that
 * react-router-dom hooks and the progress context are both available.
 */
function renderLesson(lessonId: string) {
  const initialPath = `/courses/${COURSE_ID}/lessons/${lessonId}`
  return render(
    <ProgressProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={<LessonView />}
          />
        </Routes>
      </MemoryRouter>
    </ProgressProvider>,
  )
}

// ---------------------------------------------------------------------------
// 1. Lesson content renders correctly
// ---------------------------------------------------------------------------

describe('Lesson content renders correctly', () => {
  it('renders the lesson title', () => {
    renderLesson(FIRST_LESSON.id)
    expect(
      screen.getByRole('heading', { name: FIRST_LESSON.title }),
    ).toBeInTheDocument()
  })

  it('renders the lesson body text', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByText(FIRST_LESSON.content)).toBeInTheDocument()
  })

  it('renders the lesson duration', () => {
    renderLesson(FIRST_LESSON.id)
    expect(
      screen.getByText(`${FIRST_LESSON.duration} min read`),
    ).toBeInTheDocument()
  })

  it('renders the lesson type badge', () => {
    renderLesson(FIRST_LESSON.id)
    const expectedType =
      FIRST_LESSON.type.charAt(0).toUpperCase() + FIRST_LESSON.type.slice(1)
    expect(screen.getByText(expectedType)).toBeInTheDocument()
  })

  it('renders the lesson-content wrapper', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('lesson-content')).toBeInTheDocument()
  })

  it('renders the full lesson-view layout', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('lesson-view')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 2. Navigation to next / previous lesson works
// ---------------------------------------------------------------------------

describe('Navigation to next/previous lesson works', () => {
  it('shows a "next lesson" button when there is a following lesson', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('next-lesson-btn')).toBeInTheDocument()
  })

  it('next button label contains the next lesson title', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('next-lesson-btn')).toHaveTextContent(
      SECOND_LESSON.title,
    )
  })

  it('does NOT show a previous link on the first lesson', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.queryByTestId('prev-lesson-link')).not.toBeInTheDocument()
  })

  it('shows a previous link when not on the first lesson', () => {
    renderLesson(SECOND_LESSON.id)
    expect(screen.getByTestId('prev-lesson-link')).toBeInTheDocument()
  })

  it('previous link label contains the previous lesson title', () => {
    renderLesson(SECOND_LESSON.id)
    expect(screen.getByTestId('prev-lesson-link')).toHaveTextContent(
      FIRST_LESSON.title,
    )
  })

  it('does NOT show a next button on the final lesson', () => {
    renderLesson(LAST_LESSON.id)
    expect(screen.queryByTestId('next-lesson-btn')).not.toBeInTheDocument()
  })

  it('clicking next navigates to the next lesson', async () => {
    const user = userEvent.setup()
    // Render with two routes so navigation actually changes the URL
    render(
      <ProgressProvider>
        <MemoryRouter
          initialEntries={[
            `/courses/${COURSE_ID}/lessons/${FIRST_LESSON.id}`,
          ]}
        >
          <Routes>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<LessonView />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>,
    )

    await user.click(screen.getByTestId('next-lesson-btn'))

    // After navigation the heading should be the second lesson's title
    expect(
      screen.getByRole('heading', { name: SECOND_LESSON.title }),
    ).toBeInTheDocument()
  })

  it('clicking previous navigates to the previous lesson', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <MemoryRouter
          initialEntries={[
            `/courses/${COURSE_ID}/lessons/${SECOND_LESSON.id}`,
          ]}
        >
          <Routes>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<LessonView />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>,
    )

    await user.click(screen.getByTestId('prev-lesson-link'))

    expect(
      screen.getByRole('heading', { name: FIRST_LESSON.title }),
    ).toBeInTheDocument()
  })

  it('renders the lesson navigation landmark', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('lesson-navigation')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 3. Sidebar shows correct lesson list
// ---------------------------------------------------------------------------

describe('Sidebar shows correct lesson list', () => {
  it('renders the sidebar navigation landmark', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByRole('navigation', { name: 'Lesson list' })).toBeInTheDocument()
  })

  it('renders all lessons in the sidebar', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    LESSONS.forEach((lesson) => {
      expect(within(sidebar).getByText(lesson.title)).toBeInTheDocument()
    })
  })

  it('renders the correct number of lesson links', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const links = within(sidebar).getAllByRole('link')
    expect(links).toHaveLength(LESSONS.length)
  })

  it('each sidebar link points to the correct lesson URL', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    LESSONS.forEach((lesson) => {
      const link = within(sidebar).getByRole('link', { name: new RegExp(lesson.title) })
      expect(link).toHaveAttribute(
        'href',
        `/courses/${COURSE_ID}/lessons/${lesson.id}`,
      )
    })
  })

  it('milestone lessons show a "Milestone" badge in the sidebar', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    expect(within(sidebar).getByText('Milestone')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 4. Current lesson is highlighted in sidebar
// ---------------------------------------------------------------------------

describe('Current lesson is highlighted in sidebar', () => {
  it('the active lesson link has aria-current="page"', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const activeLink = within(sidebar).getByRole('link', {
      name: new RegExp(FIRST_LESSON.title),
    })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('non-active lesson links do NOT have aria-current', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const otherLink = within(sidebar).getByRole('link', {
      name: new RegExp(SECOND_LESSON.title),
    })
    expect(otherLink).not.toHaveAttribute('aria-current')
  })

  it('the active list item has the --active modifier class', () => {
    renderLesson(SECOND_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const activeLink = within(sidebar).getByRole('link', {
      name: new RegExp(SECOND_LESSON.title),
    })
    // The <li> wrapping the active link should carry the active class
    expect(activeLink.closest('li')).toHaveClass('lesson-list-item--active')
  })

  it('non-active list items do NOT have the --active modifier class', () => {
    renderLesson(FIRST_LESSON.id)
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const otherLink = within(sidebar).getByRole('link', {
      name: new RegExp(SECOND_LESSON.title),
    })
    expect(otherLink.closest('li')).not.toHaveClass('lesson-list-item--active')
  })

  it('active lesson changes when navigating to a different lesson', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <MemoryRouter
          initialEntries={[
            `/courses/${COURSE_ID}/lessons/${FIRST_LESSON.id}`,
          ]}
        >
          <Routes>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<LessonView />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>,
    )

    await user.click(screen.getByTestId('next-lesson-btn'))

    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const newActiveLink = within(sidebar).getByRole('link', {
      name: new RegExp(SECOND_LESSON.title),
    })
    expect(newActiveLink).toHaveAttribute('aria-current', 'page')
  })
})

// ---------------------------------------------------------------------------
// 5. Progress is marked complete after finishing a lesson
// ---------------------------------------------------------------------------

describe('Progress is marked complete after finishing lesson', () => {
  it('shows a "Mark as Complete" button for an incomplete lesson', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.getByTestId('mark-complete-btn')).toBeInTheDocument()
  })

  it('clicking "Mark as Complete" removes the button', async () => {
    const user = userEvent.setup()
    renderLesson(FIRST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.queryByTestId('mark-complete-btn')).not.toBeInTheDocument()
  })

  it('clicking "Mark as Complete" shows the completion badge', async () => {
    const user = userEvent.setup()
    renderLesson(FIRST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.getByTestId('lesson-complete-badge')).toBeInTheDocument()
  })

  it('completion badge contains a checkmark', async () => {
    const user = userEvent.setup()
    renderLesson(FIRST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.getByTestId('lesson-complete-badge')).toHaveTextContent('✓')
  })

  it('clicking next marks the lesson complete and navigates', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <MemoryRouter
          initialEntries={[
            `/courses/${COURSE_ID}/lessons/${FIRST_LESSON.id}`,
          ]}
        >
          <Routes>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<LessonView />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>,
    )

    await user.click(screen.getByTestId('next-lesson-btn'))

    // We are now on lesson 2; navigate back to lesson 1 via sidebar
    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    await user.click(
      within(sidebar).getByRole('link', { name: new RegExp(FIRST_LESSON.title) }),
    )

    // Lesson 1 should now show as complete (no mark-complete button)
    expect(screen.queryByTestId('mark-complete-btn')).not.toBeInTheDocument()
    expect(screen.getByTestId('lesson-complete-badge')).toBeInTheDocument()
  })

  it('completed lessons show a ✓ icon in the sidebar', async () => {
    const user = userEvent.setup()
    render(
      <ProgressProvider>
        <MemoryRouter
          initialEntries={[
            `/courses/${COURSE_ID}/lessons/${FIRST_LESSON.id}`,
          ]}
        >
          <Routes>
            <Route
              path="/courses/:courseId/lessons/:lessonId"
              element={<LessonView />}
            />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>,
    )

    await user.click(screen.getByTestId('mark-complete-btn'))

    const sidebar = screen.getByRole('navigation', { name: 'Lesson list' })
    const activeItem = within(sidebar)
      .getByRole('link', { name: new RegExp(FIRST_LESSON.title) })
      .closest('li')!

    expect(activeItem).toHaveClass('lesson-list-item--complete')
  })
})

// ---------------------------------------------------------------------------
// 6. Final lesson shows completion CTA
// ---------------------------------------------------------------------------

describe('Final lesson shows completion CTA', () => {
  it('does NOT show the completion CTA before the lesson is complete', () => {
    renderLesson(LAST_LESSON.id)
    expect(screen.queryByTestId('completion-cta')).not.toBeInTheDocument()
  })

  it('shows the completion CTA after marking the final lesson complete', async () => {
    const user = userEvent.setup()
    renderLesson(LAST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.getByTestId('completion-cta')).toBeInTheDocument()
  })

  it('completion CTA contains a congratulatory heading', async () => {
    const user = userEvent.setup()
    renderLesson(LAST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(
      screen.getByRole('heading', { name: /completed the course/i }),
    ).toBeInTheDocument()
  })

  it('completion CTA mentions the course title', async () => {
    const user = userEvent.setup()
    renderLesson(LAST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.getByTestId('completion-cta')).toHaveTextContent(
      SAMPLE_COURSE.title,
    )
  })

  it('completion CTA has a "Browse More Courses" link pointing to /', async () => {
    const user = userEvent.setup()
    renderLesson(LAST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    const link = screen.getByTestId('back-to-courses-link')
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveTextContent(/browse more courses/i)
  })

  it('does NOT show the completion CTA on a non-final lesson', async () => {
    const user = userEvent.setup()
    renderLesson(FIRST_LESSON.id)
    await user.click(screen.getByTestId('mark-complete-btn'))
    expect(screen.queryByTestId('completion-cta')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// 7. Milestone submission form renders on milestone lessons
// ---------------------------------------------------------------------------

describe('Milestone submission form renders on milestone lessons', () => {
  it('renders the milestone form on a milestone lesson', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(screen.getByTestId('milestone-form')).toBeInTheDocument()
  })

  it('does NOT render the milestone form on a regular lesson', () => {
    renderLesson(FIRST_LESSON.id)
    expect(screen.queryByTestId('milestone-form')).not.toBeInTheDocument()
  })

  it('milestone form has an accessible label', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(
      screen.getByRole('form', { name: /milestone submission form/i }),
    ).toBeInTheDocument()
  })

  it('milestone form contains a textarea', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(
      screen.getByRole('textbox', { name: /your submission/i }),
    ).toBeInTheDocument()
  })

  it('milestone form contains a submit button', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(
      screen.getByRole('button', { name: /submit milestone/i }),
    ).toBeInTheDocument()
  })

  it('shows a validation error when submitting an empty form', async () => {
    const user = userEvent.setup()
    renderLesson(MILESTONE_LESSON.id)
    await user.click(screen.getByRole('button', { name: /submit milestone/i }))
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be empty/i)
  })

  it('shows success state after a valid submission', async () => {
    const user = userEvent.setup()
    renderLesson(MILESTONE_LESSON.id)
    await user.type(
      screen.getByRole('textbox', { name: /your submission/i }),
      'My milestone answer',
    )
    await user.click(screen.getByRole('button', { name: /submit milestone/i }))
    expect(screen.getByTestId('milestone-success')).toBeInTheDocument()
  })

  it('success state displays the submitted content', async () => {
    const user = userEvent.setup()
    renderLesson(MILESTONE_LESSON.id)
    const answer = 'TypeScript is awesome!'
    await user.type(
      screen.getByRole('textbox', { name: /your submission/i }),
      answer,
    )
    await user.click(screen.getByRole('button', { name: /submit milestone/i }))
    expect(screen.getByTestId('milestone-success')).toHaveTextContent(answer)
  })

  it('does NOT show the "Mark as Complete" button on milestone lessons', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(screen.queryByTestId('mark-complete-btn')).not.toBeInTheDocument()
  })

  it('milestone lesson does not show the regular complete badge initially', () => {
    renderLesson(MILESTONE_LESSON.id)
    expect(screen.queryByTestId('lesson-complete-badge')).not.toBeInTheDocument()
  })
})
