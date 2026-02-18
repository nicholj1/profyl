"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Send,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface AnswerOption {
  id: string
  sortOrder: number
  text: string
}

interface Question {
  id: string
  sortOrder: number
  text: string
  questionType: string
  answerOptions: AnswerOption[]
}

interface QuizData {
  id: string
  slug: string
  title: string
  description: string | null
  emailCapture: boolean
  questionCount: number
  questions: Question[]
}

interface ResultData {
  result_type: {
    name: string
    description: string
    colour: string | null
  }
}

type QuizPhase = "loading" | "intro" | "questions" | "email" | "submitting" | "result" | "error"

export default function PublicQuizPage() {
  const params = useParams()
  const slug = params.slug as string

  const [phase, setPhase] = useState<QuizPhase>("loading")
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string>>(new Map())
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<ResultData | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/quizzes/${slug}`)
      if (!res.ok) {
        setErrorMsg("This quiz is not available.")
        setPhase("error")
        return
      }
      const data = await res.json()
      setQuiz(data.quiz)
      setPhase("intro")
    } catch {
      setErrorMsg("Unable to load quiz. Please try again.")
      setPhase("error")
    }
  }, [slug])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, optionId)
      return next
    })
  }

  function goNext() {
    if (!quiz) return
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    } else {
      // All questions answered
      if (quiz.emailCapture) {
        setPhase("email")
      } else {
        submitQuiz()
      }
    }
  }

  function goBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  async function submitQuiz(respondentEmail?: string) {
    if (!quiz) return
    setPhase("submitting")

    try {
      const answerArray = Array.from(answers.entries()).map(
        ([questionId, optionId]) => ({
          question_id: questionId,
          option_id: optionId,
        })
      )

      const res = await fetch(`/api/public/quizzes/${slug}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answerArray,
          email: respondentEmail || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      const data = await res.json()
      setResult(data.result)
      setPhase("result")
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      )
      setPhase("error")
    }
  }

  // Loading state
  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (phase === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="mb-2 text-xl font-semibold">{errorMsg}</h1>
          <p className="text-sm text-muted-foreground">
            If you think this is an error, please contact the quiz creator.
          </p>
        </div>
      </div>
    )
  }

  if (!quiz) return null

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="mb-6 text-muted-foreground">{quiz.description}</p>
          )}
          <p className="mb-8 text-sm text-muted-foreground">
            {quiz.questionCount} questions &middot; Takes about 2 minutes
          </p>
          <Button size="lg" onClick={() => setPhase("questions")}>
            Start Quiz
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-8 text-xs text-muted-foreground">
            Powered by{" "}
            <span className="font-medium text-primary">Profyl</span>
          </p>
        </div>
      </div>
    )
  }

  // Submitting state
  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Calculating your result...</p>
      </div>
    )
  }

  // Result screen
  if (phase === "result" && result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Your result
          </p>
          <h1
            className="mb-4 text-3xl font-bold"
            style={{ color: result.result_type.colour || undefined }}
          >
            {result.result_type.name}
          </h1>
          <div className="mb-8 rounded-lg border bg-card p-6 text-left">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {result.result_type.description}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <span className="font-medium text-primary">Profyl</span>
          </p>
        </div>
      </div>
    )
  }

  // Email capture screen
  if (phase === "email") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Send className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-bold">
            Almost there!
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Enter your email to see your personalised result.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submitQuiz(email)
            }}
            className="space-y-4"
          >
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-center"
            />
            <Button type="submit" size="lg" className="w-full">
              See My Result
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs text-muted-foreground"
            onClick={() => submitQuiz()}
          >
            Skip and see result
          </Button>
        </div>
      </div>
    )
  }

  // Questions phase
  const question = quiz.questions[currentQuestion]
  const selectedOptionId = answers.get(question.id)
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const isLastQuestion = currentQuestion === quiz.questions.length - 1

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{quiz.title}</span>
            <span>
              {currentQuestion + 1} of {quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="mx-auto w-full max-w-xl">
          <h2 className="mb-8 text-center text-xl font-semibold leading-snug">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.answerOptions.map((option) => {
              const isSelected = selectedOptionId === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => selectOption(question.id, option.id)}
                  className={`w-full rounded-lg border-2 p-4 text-left text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={goNext}
            disabled={!selectedOptionId}
          >
            {isLastQuestion ? (
              <>
                Finish
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
