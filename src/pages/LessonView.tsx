import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { COURSES } from '@/data/courses'
import { useProgress } from '@/context/ProgressContext'
import { LessonSidebar } from '@/components/LessonSidebar'
import { LessonContent } from '@/components/LessonContent'
import { MilestoneForm } from '@/components/MilestoneForm'

export function LessonView() {
  const { courseId = '', lessonId = '' } = useParams<{
    courseId: string
    lessonId: string
  }>()
  const navigate = useNavigate()
  const { isLessonComplete, markLessonComplete } = useProgress()

  const course = COURSES.find((c) => c.id === courseId)

  if (!course) {
    return (
      <main className="error-page" data-testid="error-not-found">
        <h1>Course not found</h1>
        <Link to="/">Back to courses</Link>
      </main>
    )
  }

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order)
  const currentIndex = sortedLessons.findIndex((l) => l.id === lessonId)

  if (currentIndex === -1) {
    return (
      <main className="error-page" data-testid="error-not-found">
        <h1>Lesson not found</h1>
        <Link to={`/courses/${courseId}`}>Back to course</Link>
      </main>
    )
  }

  const lesson = sortedLessons[currentIndex]
  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null
  const isFinalLesson = nextLesson === null
  const isComplete = isLessonComplete(courseId, lessonId)
  const isMilestone = lesson.type === 'milestone'

  function handleMarkComplete() {
    markLessonComplete(courseId, lessonId)
  }

  function handleNext() {
    if (!isComplete) {
      markLessonComplete(courseId, lessonId)
    }
    if (nextLesson) {
      navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)
    }
  }

  return (
    <div className="lesson-view" data-testid="lesson-view">
      <LessonSidebar
        courseId={courseId}
        lessons={sortedLessons}
        currentLessonId={lessonId}
      />

      <main className="lesson-main">
        <LessonContent lesson={lesson} />

        {isMilestone && (
          <MilestoneForm
            lessonId={lessonId}
            courseId={courseId}
            onSubmitted={() => {
              if (nextLesson) {
                navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)
              }
            }}
          />
        )}

        {!isMilestone && !isComplete && (
          <button
            className="btn btn--secondary"
            onClick={handleMarkComplete}
            data-testid="mark-complete-btn"
          >
            Mark as Complete
          </button>
        )}

        {!isMilestone && isComplete && (
          <p
            className="lesson-complete-badge"
            role="status"
            data-testid="lesson-complete-badge"
          >
            ✓ Lesson complete
          </p>
        )}

        <nav
          className="lesson-navigation"
          aria-label="Lesson navigation"
          data-testid="lesson-navigation"
        >
          {prevLesson ? (
            <Link
              to={`/courses/${courseId}/lessons/${prevLesson.id}`}
              className="btn btn--nav btn--prev"
              data-testid="prev-lesson-link"
            >
              ← {prevLesson.title}
            </Link>
          ) : (
            <span />
          )}

          {nextLesson && (
            <button
              className="btn btn--nav btn--next"
              onClick={handleNext}
              data-testid="next-lesson-btn"
            >
              {nextLesson.title} →
            </button>
          )}
        </nav>

        {isFinalLesson && isComplete && (
          <section
            className="course-completion-cta"
            aria-label="Course completion"
            data-testid="completion-cta"
          >
            <h2>🎉 You've completed the course!</h2>
            <p>
              Congratulations on finishing{' '}
              <strong>{course.title}</strong>. You're ready for the next
              challenge.
            </p>
            <Link to="/" className="btn btn--primary" data-testid="back-to-courses-link">
              Browse More Courses
            </Link>
          </section>
        )}
      </main>
    </div>
  )
}
