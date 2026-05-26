import type { Course } from '@/types'

export const SAMPLE_COURSE: Course = {
  id: 'course-1',
  title: 'Introduction to TypeScript',
  description: 'Learn TypeScript from the ground up.',
  lessons: [
    {
      id: 'lesson-1',
      title: 'What is TypeScript?',
      type: 'text',
      content:
        'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
      duration: 5,
      order: 1,
    },
    {
      id: 'lesson-2',
      title: 'Setting Up Your Environment',
      type: 'video',
      content:
        'In this lesson we will install Node.js, the TypeScript compiler, and configure VS Code for the best TypeScript experience.',
      duration: 10,
      order: 2,
    },
    {
      id: 'lesson-3',
      title: 'Basic Types',
      type: 'text',
      content:
        'TypeScript supports primitive types such as string, number, boolean, null, undefined, and symbol.',
      duration: 8,
      order: 3,
    },
    {
      id: 'lesson-4',
      title: 'Module 1 Milestone',
      type: 'milestone',
      content:
        'Demonstrate your understanding of TypeScript basics by completing the milestone project below.',
      duration: 20,
      order: 4,
    },
    {
      id: 'lesson-5',
      title: 'Interfaces and Types',
      type: 'text',
      content:
        'Interfaces allow you to define the shape of an object. Type aliases provide an alternative syntax for the same purpose.',
      duration: 12,
      order: 5,
    },
    {
      id: 'lesson-6',
      title: 'Generics',
      type: 'text',
      content:
        'Generics enable you to write reusable, type-safe functions and data structures that work with any type.',
      duration: 15,
      order: 6,
    },
  ],
}

export const COURSES: Course[] = [SAMPLE_COURSE]
