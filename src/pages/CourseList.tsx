import React from 'react'
import { Link } from 'react-router-dom'
import { COURSES } from '@/data/courses'

export function CourseList() {
  return (
    <main className="course-list-page">
      <h1>LearnVault</h1>
      <p className="subtitle">Pick a course and start learning.</p>
      <ul className="course-grid">
        {COURSES.map((course) => (
          <li key={course.id} className="course-card">
            <h2 className="course-card-title">{course.title}</h2>
            <p className="course-card-description">{course.description}</p>
            <Link
              to={`/courses/${course.id}/lessons/${course.lessons[0].id}`}
              className="btn btn--primary"
            >
              Start Course
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
