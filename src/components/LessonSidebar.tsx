import React from 'react'
import { Link } from 'react-router-dom'
import type { Lesson } from '@/types'
import { useProgress } from '@/context/ProgressContext'

interface LessonSidebarProps {
  courseId: string
  lessons: Lesson[]
  currentLessonId: string
}

export function LessonSidebar({
  courseId,
  lessons,
  currentLessonId,
}: LessonSidebarProps) {
  const { isLessonComplete } = useProgress()

  return (
    <nav aria-label="Lesson list" className="lesson-sidebar">
      <h2 className="sidebar-title">Lessons</h2>
      <ol className="lesson-list">
        {lessons.map((lesson) => {
          const isActive = lesson.id === currentLessonId
          const isComplete = isLessonComplete(courseId, lesson.id)

          return (
            <li
              key={lesson.id}
              className={[
                'lesson-list-item',
                isActive ? 'lesson-list-item--active' : '',
                isComplete ? 'lesson-list-item--complete' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <Link
                to={`/courses/${courseId}/lessons/${lesson.id}`}
                aria-current={isActive ? 'page' : undefined}
                className="lesson-link"
              >
                <span className="lesson-status-icon" aria-hidden="true">
                  {isComplete ? '✓' : lesson.order}
                </span>
                <span className="lesson-title">{lesson.title}</span>
                {lesson.type === 'milestone' && (
                  <span className="lesson-badge lesson-badge--milestone">
                    Milestone
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
