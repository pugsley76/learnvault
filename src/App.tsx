import React from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProgressProvider } from '@/context/ProgressContext'
import { CourseList } from '@/pages/CourseList'
import { LessonView } from '@/pages/LessonView'

export function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CourseList />} />
          <Route
            path="/courses/:courseId/lessons/:lessonId"
            element={<LessonView />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ProgressProvider>
  )
}
