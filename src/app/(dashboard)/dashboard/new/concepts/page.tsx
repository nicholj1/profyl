"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface QuizConcept {
  title: string
  description: string
  outcome_framing: string
  result_type_names: string[]
}

interface BrandSummary {
  brand_name: string
  industry: string
  target_audience: string
  tone: string
  key_themes: string[]
  summary: string
}

export default function ConceptSelectionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [concepts, setConcepts] = useState<QuizConcept[]>([])
  const [brandSummary, setBrandSummary] = useState<BrandSummary | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string>("")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const loadConcepts = useCallback(
    async (summary: BrandSummary, wsId: string) => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/workspaces/${wsId}/quizzes/generate-concepts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brand_summary: summary }),
          }
        )

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to generate concepts")
        }

        const data = await res.json()
        setConcepts(data.concepts)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong"
        toast({
          title: "Failed to generate concepts",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    const storedSummary = sessionStorage.getItem("profyl_brand_summary")
    const storedWorkspaceId = sessionStorage.getItem("profyl_workspace_id")

    if (!storedSummary || !storedWorkspaceId) {
      router.replace("/dashboard/new")
      return
    }

    try {
      const summary = JSON.parse(storedSummary) as BrandSummary
      setBrandSummary(summary)
      setWorkspaceId(storedWorkspaceId)
      loadConcepts(summary, storedWorkspaceId)
    } catch {
      router.replace("/dashboard/new")
    }
  }, [router, loadConcepts])

  async function handleRegenerate() {
    if (!brandSummary || !workspaceId) return
    setSelectedIndex(null)
    setIsGenerating(true)
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/quizzes/generate-concepts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brand_summary: brandSummary }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to regenerate concepts")
      }

      const data = await res.json()
      setConcepts(data.concepts)
      toast({
        title: "New concepts generated",
        description: "Pick the one that best fits your goals.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
      toast({
        title: "Regeneration failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCreateQuiz() {
    if (selectedIndex === null || !brandSummary || !workspaceId) return

    setIsCreating(true)

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/quizzes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            concept: concepts[selectedIndex],
            brand_summary: brandSummary,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create quiz")
      }

      const data = await res.json()

      // Clear session storage
      sessionStorage.removeItem("profyl_brand_summary")
      sessionStorage.removeItem("profyl_workspace_id")

      toast({
        title: "Quiz created!",
        description:
          "Your quiz has been generated. Review and edit it before publishing.",
      })

      router.push(`/dashboard/quizzes/${data.quiz.id}/edit`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
      toast({
        title: "Quiz creation failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">
            Generating quiz concepts for your brand...
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This usually takes 15-20 seconds
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/new")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Choose a Quiz Concept</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {brandSummary
            ? `Based on ${brandSummary.brand_name}, we've created ${concepts.length} quiz ideas. Pick the one that best fits your goals.`
            : `We've created ${concepts.length} quiz ideas. Pick the one that best fits your goals.`}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span>Your Brand</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          2
        </span>
        <span className="font-medium text-foreground">Choose Concept</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
          3
        </span>
        <span>Review & Edit</span>
      </div>

      {/* Concept cards */}
      <div className="space-y-4">
        {concepts.map((concept, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              selectedIndex === index
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/40"
            }`}
            onClick={() => setSelectedIndex(index)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{concept.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {concept.description}
                  </CardDescription>
                </div>
                {selectedIndex === index && (
                  <CheckCircle2 className="ml-4 h-5 w-5 flex-shrink-0 text-primary" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Outcome framing
                  </p>
                  <p className="mt-0.5 text-sm">{concept.outcome_framing}</p>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Result types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {concept.result_type_names.map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={isGenerating || isCreating}
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Regenerate Ideas
        </Button>

        <Button
          onClick={handleCreateQuiz}
          disabled={selectedIndex === null || isCreating}
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Create This Quiz
            </>
          )}
        </Button>
      </div>

      {isCreating && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Building your quiz</p>
              <p className="text-xs text-muted-foreground">
                The AI is crafting questions, answer options, and result types.
                This usually takes 30-60 seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
