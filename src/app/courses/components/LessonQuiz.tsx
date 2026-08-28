'use client'

import React, { useState } from 'react'

interface QuizProps {
  quizzes: any[]
  lessonId: string
}

export default function LessonQuiz({ quizzes, lessonId }: QuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  if (!quizzes || quizzes.length === 0) return null

  const handleSelectOption = (quizId: string, option: string) => {
    if (submitted[quizId]) return
    setSelectedAnswers({ ...selectedAnswers, [quizId]: option })
  }

  const handleCheckAnswer = (quizId: string) => {
    setSubmitted({ ...submitted, [quizId]: true })
  }

  return (
    <div className="mt-8 p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-sm">
          💡
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Knowledge Check</h3>
          <p className="text-xs text-slate-400">Test your understanding of this lesson module</p>
        </div>
      </div>

      <div className="space-y-6">
        {quizzes.map((quiz, index) => {
          const options = quiz.options || [] // Assumes JSON/array format of options
          const selected = selectedAnswers[quiz.id]
          const isSubmitted = submitted[quiz.id]
          const isCorrect = selected === quiz.correct_answer

          return (
            <div key={quiz.id} className="p-5 rounded-xl bg-black/40 border border-white/5 space-y-4">
              <p className="text-sm font-semibold text-slate-200">
                {index + 1}. {quiz.question}
              </p>

              <div className="space-y-2">
                {options.map((opt: string) => {
                  let optStyle = "border-white/5 bg-white/[0.02] text-slate-300 hover:border-white/20"
                  if (selected === opt) {
                    optStyle = "border-brand-primary/50 bg-brand-primary/10 text-white font-medium"
                  }
                  if (isSubmitted) {
                    if (opt === quiz.correct_answer) {
                      optStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-medium"
                    } else if (selected === opt) {
                      optStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(quiz.id, opt)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                    </button>
                  )
                })}
              </div>

              {!isSubmitted ? (
                <button
                  disabled={!selected}
                  onClick={() => handleCheckAnswer(quiz.id)}
                  className="px-4 py-2 bg-brand-primary hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  Submit Answer
                </button>
              ) : (
                <div className={`text-xs font-bold p-3 rounded-lg flex items-center space-x-2 ${
                  isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <span>{isCorrect ? '✓ Correct! Great job.' : `✕ Incorrect. The correct answer is: ${quiz.correct_answer}`}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
