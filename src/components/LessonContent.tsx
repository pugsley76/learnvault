import React from 'react'
import type { Lesson } from '@/types'

interface LessonContentProps {
  lesson: Lesson
}

export function LessonContent({ lesson }: LessonContentProps) {
  return (
    <article className="lesson-content" data-testid="lesson-content">
      <header className="lesson-content-header">
        <span className="lesson-type-badge lesson-type-badge--{lesson.type}">
          {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
        </span>
        <h1 className="lesson-content-title">{lesson.title}</h1>
        <p className="lesson-duration">
          <span aria-hidden="true">⏱</span>{' '}
          <span>{lesson.duration} min read</span>
        </p>
      </header>
      <div className="lesson-body">
        <p>{lesson.content}</p>
      </div>
    </article>
  )
}
