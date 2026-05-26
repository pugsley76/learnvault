import React, { createContext, useCallback, useContext, useState } from 'react'
import type { CourseProgress, MilestoneSubmission } from '@/types'

interface ProgressContextValue {
  progress: Record<string, CourseProgress>
  isLessonComplete: (courseId: string, lessonId: string) => boolean
  markLessonComplete: (courseId: string, lessonId: string) => void
  submissions: MilestoneSubmission[]
  submitMilestone: (lessonId: string, content: string) => void
  getMilestoneSubmission: (lessonId: string) => MilestoneSubmission | undefined
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({})
  const [submissions, setSubmissions] = useState<MilestoneSubmission[]>([])

  const isLessonComplete = useCallback(
    (courseId: string, lessonId: string): boolean => {
      return progress[courseId]?.lessons[lessonId]?.completed ?? false
    },
    [progress],
  )

  const markLessonComplete = useCallback(
    (courseId: string, lessonId: string) => {
      setProgress((prev) => {
        const courseProgress = prev[courseId] ?? { courseId, lessons: {} }
        return {
          ...prev,
          [courseId]: {
            ...courseProgress,
            lessons: {
              ...courseProgress.lessons,
              [lessonId]: {
                lessonId,
                completed: true,
                completedAt: new Date().toISOString(),
              },
            },
          },
        }
      })
    },
    [],
  )

  const submitMilestone = useCallback((lessonId: string, content: string) => {
    setSubmissions((prev) => [
      ...prev.filter((s) => s.lessonId !== lessonId),
      { lessonId, content, submittedAt: new Date().toISOString() },
    ])
  }, [])

  const getMilestoneSubmission = useCallback(
    (lessonId: string) => submissions.find((s) => s.lessonId === lessonId),
    [submissions],
  )

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isLessonComplete,
        markLessonComplete,
        submissions,
        submitMilestone,
        getMilestoneSubmission,
      }}
    >
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) {
    throw new Error('useProgress must be used within a ProgressProvider')
  }
  return ctx
}
