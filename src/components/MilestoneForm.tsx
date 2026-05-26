import React, { useState } from 'react'
import { useProgress } from '@/context/ProgressContext'

interface MilestoneFormProps {
  lessonId: string
  courseId: string
  onSubmitted?: () => void
}

export function MilestoneForm({
  lessonId,
  courseId,
  onSubmitted,
}: MilestoneFormProps) {
  const { submitMilestone, getMilestoneSubmission, markLessonComplete } =
    useProgress()
  const existing = getMilestoneSubmission(lessonId)
  const [value, setValue] = useState(existing?.content ?? '')
  const [submitted, setSubmitted] = useState(Boolean(existing))
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) {
      setError('Submission cannot be empty.')
      return
    }
    setError('')
    submitMilestone(lessonId, value.trim())
    markLessonComplete(courseId, lessonId)
    setSubmitted(true)
    onSubmitted?.()
  }

  if (submitted) {
    return (
      <div
        className="milestone-success"
        role="status"
        aria-live="polite"
        data-testid="milestone-success"
      >
        <p>
          <strong>Milestone submitted!</strong> Great work.
        </p>
        <blockquote className="milestone-submission-preview">{value}</blockquote>
      </div>
    )
  }

  return (
    <form
      className="milestone-form"
      onSubmit={handleSubmit}
      aria-label="Milestone submission form"
      data-testid="milestone-form"
    >
      <h3 className="milestone-form-title">Submit Your Milestone</h3>
      <p className="milestone-form-description">
        Write your response below. Be thorough — this is your chance to
        demonstrate what you have learned.
      </p>
      <label htmlFor="milestone-input" className="milestone-label">
        Your submission
      </label>
      <textarea
        id="milestone-input"
        className="milestone-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder="Write your milestone submission here…"
        aria-describedby={error ? 'milestone-error' : undefined}
        aria-required="true"
      />
      {error && (
        <p id="milestone-error" className="milestone-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primary">
        Submit Milestone
      </button>
    </form>
  )
}
