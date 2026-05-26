export type LessonType = 'video' | 'text' | 'quiz' | 'milestone'

export interface Lesson {
  id: string
  title: string
  type: LessonType
  content: string
  /** Estimated duration in minutes */
  duration: number
  order: number
}

export interface Course {
  id: string
  title: string
  description: string
  lessons: Lesson[]
}

export interface LessonProgress {
  lessonId: string
  completed: boolean
  completedAt?: string
}

export interface CourseProgress {
  courseId: string
  lessons: Record<string, LessonProgress>
}

export interface MilestoneSubmission {
  lessonId: string
  content: string
  submittedAt: string
}
