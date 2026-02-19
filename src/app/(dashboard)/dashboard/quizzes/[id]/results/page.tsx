"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Check,
  X,
  Globe,
  Copy,
  ExternalLink,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ResultType {
  id: string
  sortOrder: number
  name: string
  description: string
  recommendationDetail: string | null
  colour: string | null
}

interface Quiz {
  id: string
  slug: string
  title: string
  description: string | null
  status: string
  emailCapture: boolean
  resultTypes: ResultType[]
}

export default function ResultTypesPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // Editing state
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState("")
  const [descriptionDraft, setDescriptionDraft] = useState("")
  const [recommendationDetailDraft, setRecommendationDetailDraft] = useState("")
  const [colourDraft, setColourDraft] = useState("")

  // Published state
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [embedCode, setEmbedCode] = useState<string | null>(null)

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

  async function saveResultType(resultTypeId: string) {
    if (!quiz) return
    setIsSaving(true)
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/result-types/${resultTypeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nameDraft,
            description: descriptionDraft,
            recommendation_detail: recommendationDetailDraft,
            colour: colourDraft,
          }),
        }
      )
      if (!res.ok) throw new Error("Failed to save")

      setQuiz((prev) => {
        if (!prev) return null
        return {
          ...prev,
          resultTypes: prev.resultTypes.map((rt) =>
            rt.id === resultTypeId
              ? {
                  ...rt,
                  name: nameDraft,
                  description: descriptionDraft,
                  recommendationDetail: recommendationDetailDraft,
                  colour: colourDraft,
                }
              : rt
          ),
        }
      })

      setEditingResultId(null)
      toast({ title: "Saved", description: "Result type updated." })
    } catch {
      toast({
        title: "Save failed",
        description: "Could not update result type",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleEmailCapture() {
    if (!quiz) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_capture: !quiz.emailCapture }),
      })
      if (!res.ok) throw new Error("Failed to update")

      setQuiz((prev) =>
        prev ? { ...prev, emailCapture: !prev.emailCapture } : null
      )
    } catch {
      toast({
        title: "Failed to update",
        description: "Could not toggle email capture",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!quiz) return
    setIsPublishing(true)
    try {
      const newStatus = quiz.status === "live" ? "draft" : "live"
      const res = await fetch(`/api/quizzes/${quizId}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to publish")
      }

      const data = await res.json()
      setQuiz((prev) =>
        prev ? { ...prev, status: newStatus } : null
      )

      if (newStatus === "live") {
        setPublicUrl(data.quiz.public_url)
        setEmbedCode(data.quiz.embed_code)
        toast({
          title: "Quiz published!",
          description: "Your quiz is now live and ready to share.",
        })
      } else {
        setPublicUrl(null)
        setEmbedCode(null)
        toast({
          title: "Quiz unpublished",
          description: "Your quiz has been set back to draft.",
        })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
      toast({
        title: "Publish failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast({ title: "Copied!", description: `${label} copied to clipboard.` })
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
          onClick={() =>
            router.push(`/dashboard/quizzes/${quizId}/edit`)
          }
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit result types and publish your quiz
            </p>
          </div>
          <Badge
            variant={quiz.status === "live" ? "default" : "secondary"}
          >
            {quiz.status === "live" ? "Live" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* Result Types */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recommendations</h2>
        <p className="text-sm text-muted-foreground">
          These are the personalised recommendations quiz-takers will receive.
          Edit the names, descriptions, recommendation details, and colours to
          match your brand.
        </p>

        {quiz.resultTypes.map((rt) => (
          <Card key={rt.id}>
            <CardContent className="p-4">
              {editingResultId === rt.id ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Input
                      type="color"
                      value={colourDraft}
                      onChange={(e) => setColourDraft(e.target.value)}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      placeholder="Result type name"
                      className="font-medium"
                    />
                  </div>
                  <Textarea
                    value={descriptionDraft}
                    onChange={(e) =>
                      setDescriptionDraft(e.target.value)
                    }
                    placeholder="Why this recommendation is perfect for them (2-3 sentences)"
                    rows={3}
                  />
                  <Textarea
                    value={recommendationDetailDraft}
                    onChange={(e) =>
                      setRecommendationDetailDraft(e.target.value)
                    }
                    placeholder="The specific recommendation details — recipe, routine, product suggestion, etc."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => saveResultType(rt.id)}
                      disabled={isSaving}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingResultId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex cursor-pointer items-start gap-3"
                  onClick={() => {
                    setNameDraft(rt.name)
                    setDescriptionDraft(rt.description)
                    setRecommendationDetailDraft(rt.recommendationDetail || "")
                    setColourDraft(rt.colour || "#6C5CE7")
                    setEditingResultId(rt.id)
                  }}
                >
                  <div
                    className="mt-1 h-4 w-4 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: rt.colour || "#6C5CE7",
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rt.name}</p>
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rt.description}
                    </p>
                    {rt.recommendationDetail && (
                      <div className="mt-2 rounded bg-muted/50 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Recommendation detail
                        </p>
                        <p className="mt-0.5 text-sm">
                          {rt.recommendationDetail}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-capture" className="font-medium">
                Email capture
              </Label>
              <p className="text-sm text-muted-foreground">
                Ask respondents for their email before showing results
              </p>
            </div>
            <Switch
              id="email-capture"
              checked={quiz.emailCapture}
              onCheckedChange={toggleEmailCapture}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Publish section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Publish</CardTitle>
          <CardDescription>
            {quiz.status === "live"
              ? "Your quiz is live! Share it with your audience."
              : "When you're happy with your quiz, publish it to make it available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            variant={quiz.status === "live" ? "outline" : "default"}
            size="lg"
            className="w-full"
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {quiz.status === "live" ? "Unpublishing..." : "Publishing..."}
              </>
            ) : quiz.status === "live" ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Unpublish Quiz
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Publish Quiz
              </>
            )}
          </Button>

          {/* Published URLs */}
          {quiz.status === "live" && publicUrl && (
            <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="mb-2 text-sm font-medium">Public URL</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={publicUrl}
                    readOnly
                    className="bg-background text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(publicUrl, "Public URL")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Embed Code</p>
                <div className="flex items-start gap-2">
                  <Textarea
                    value={embedCode || ""}
                    readOnly
                    rows={3}
                    className="bg-background font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(embedCode || "", "Embed code")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom actions */}
      <div className="mt-8 flex items-center justify-between pb-8">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/quizzes/${quizId}/edit`)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Questions
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
