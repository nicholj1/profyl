"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Pencil,
  Check,
  X,
  CheckCircle2,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

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

interface ResultType {
  id: string
  sortOrder: number
  name: string
  description: string
  colour: string | null
}

interface Quiz {
  id: string
  slug: string
  title: string
  description: string | null
  status: string
  emailCapture: boolean
  questions: Question[]
  resultTypes: ResultType[]
}

export default function QuizEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Editing state
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState("")
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState("")
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null)
  const [optionDraft, setOptionDraft] = useState("")

  const fetchQuiz = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`)
      if (!res.ok) throw new Error("Failed to fetch quiz")
      const data = await res.json()
      setQuiz(data.quiz)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [quizId, toast])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  async function saveQuizField(
    field: "title" | "description",
    value: string
  ) {
    if (!quiz) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error("Failed to save")

      setQuiz((prev) =>
        prev ? { ...prev, [field]: value } : null
      )

      if (field === "title") setEditingTitle(false)
      if (field === "description") setEditingDescription(false)

      toast({ title: "Saved", description: `Quiz ${field} updated.` })
    } catch {
      toast({
        title: "Save failed",
        description: `Could not update ${field}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function saveQuestion(questionId: string, text: string) {
    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        }
      )
      if (!res.ok) throw new Error("Failed to save question")

      setQuiz((prev) => {
        if (!prev) return null
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId ? { ...q, text } : q
          ),
        }
      })

      setEditingQuestionId(null)
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update question",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function saveOption(
    questionId: string,
    optionId: string,
    text: string
  ) {
    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            options: [{ option_id: optionId, text }],
          }),
        }
      )
      if (!res.ok) throw new Error("Failed to save option")

      setQuiz((prev) => {
        if (!prev) return null
        return {
          ...prev,
          questions: prev.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  answerOptions: q.answerOptions.map((o) =>
                    o.id === optionId ? { ...o, text } : o
                  ),
                }
              : q
          ),
        }
      })

      setEditingOptionId(null)
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update answer option",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-muted-foreground">Quiz not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={quiz.status === "live" ? "default" : "secondary"}
            >
              {quiz.status === "live" ? "Live" : "Draft"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {quiz.questions.length} questions &middot;{" "}
              {quiz.resultTypes.length} result types
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/quizzes/${quizId}/responses`)
              }
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Responses
            </Button>
            <Button
              onClick={() =>
                router.push(`/dashboard/quizzes/${quizId}/results`)
              }
            >
              Result Types
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span>Your Brand</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span>Choose Concept</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          3
        </span>
        <span className="font-medium text-foreground">Review & Edit</span>
      </div>

      {/* Quiz title */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="text-lg font-semibold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveQuizField("title", titleDraft)
                      if (e.key === "Escape") setEditingTitle(false)
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => saveQuizField("title", titleDraft)}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingTitle(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle
                  className="cursor-pointer text-xl hover:text-primary"
                  onClick={() => {
                    setTitleDraft(quiz.title)
                    setEditingTitle(true)
                  }}
                >
                  {quiz.title}
                  <Pencil className="ml-2 inline h-4 w-4 text-muted-foreground" />
                </CardTitle>
              )}
            </div>
          </div>

          {/* Description */}
          {editingDescription ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingDescription(false)
                }}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    saveQuizField("description", descriptionDraft)
                  }
                  disabled={isSaving}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingDescription(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <CardDescription
              className="mt-2 cursor-pointer hover:text-foreground"
              onClick={() => {
                setDescriptionDraft(quiz.description || "")
                setEditingDescription(true)
              }}
            >
              {quiz.description || "Click to add a description..."}
              <Pencil className="ml-1 inline h-3 w-3" />
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Questions</h2>

        {quiz.questions.map((question, qIdx) => (
          <Card key={question.id}>
            <CardContent className="p-4">
              {/* Question text */}
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {qIdx + 1}
                </div>
                <div className="flex-1">
                  {editingQuestionId === question.id ? (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={questionDraft}
                        onChange={(e) => setQuestionDraft(e.target.value)}
                        rows={2}
                        autoFocus
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Escape")
                            setEditingQuestionId(null)
                        }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            saveQuestion(question.id, questionDraft)
                          }
                          disabled={isSaving}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingQuestionId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="cursor-pointer text-sm font-medium hover:text-primary"
                      onClick={() => {
                        setQuestionDraft(question.text)
                        setEditingQuestionId(question.id)
                      }}
                    >
                      {question.text}
                      <Pencil className="ml-1 inline h-3 w-3 text-muted-foreground" />
                    </p>
                  )}
                </div>
              </div>

              {/* Answer options */}
              <div className="ml-10 space-y-2">
                {question.answerOptions.map((option, oIdx) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground">
                      {String.fromCharCode(65 + oIdx)}
                    </div>
                    {editingOptionId === option.id ? (
                      <div className="flex flex-1 items-center gap-1">
                        <Input
                          value={optionDraft}
                          onChange={(e) => setOptionDraft(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              saveOption(
                                question.id,
                                option.id,
                                optionDraft
                              )
                            if (e.key === "Escape")
                              setEditingOptionId(null)
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() =>
                            saveOption(
                              question.id,
                              option.id,
                              optionDraft
                            )
                          }
                          disabled={isSaving}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingOptionId(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p
                        className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setOptionDraft(option.text)
                          setEditingOptionId(option.id)
                        }}
                      >
                        {option.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="mt-8 flex items-center justify-between pb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button
          onClick={() =>
            router.push(`/dashboard/quizzes/${quizId}/results`)
          }
        >
          Edit Result Types
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
