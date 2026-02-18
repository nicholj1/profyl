"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Globe, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function NewQuizPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [error, setError] = useState("")

  async function handleAnalyse(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("Please enter your website URL")
      return
    }

    // Basic URL validation
    let formattedUrl = url.trim()
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      new URL(formattedUrl)
    } catch {
      setError("Please enter a valid URL")
      return
    }

    setIsAnalysing(true)

    try {
      // First, get the workspace ID
      const workspaceRes = await fetch("/api/workspace")
      if (!workspaceRes.ok) {
        throw new Error("Failed to load workspace")
      }
      const { workspace } = await workspaceRes.json()

      // Analyse the URL
      const res = await fetch(
        `/api/workspaces/${workspace.id}/analyse-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: formattedUrl,
            description: description.trim() || undefined,
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to analyse URL")
      }

      const data = await res.json()

      // Store brand summary in sessionStorage for the concepts page
      sessionStorage.setItem(
        "profyl_brand_summary",
        JSON.stringify(data.brand_summary)
      )
      sessionStorage.setItem("profyl_workspace_id", workspace.id)

      toast({
        title: "Website analysed",
        description: "We've generated quiz ideas based on your brand.",
      })

      router.push("/dashboard/new/concepts")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create a New Quiz</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your website URL and our AI will generate quiz ideas tailored to
          your brand.
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          1
        </span>
        <span className="font-medium text-foreground">Your Brand</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
          2
        </span>
        <span>Choose Concept</span>
        <ArrowRight className="h-4 w-4" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
          3
        </span>
        <span>Review & Edit</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Tell us about your brand
          </CardTitle>
          <CardDescription>
            We&apos;ll scan your website to understand your brand, audience, and
            tone. This helps us create quiz questions that feel authentic to your
            business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyse} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL *</Label>
              <Input
                id="url"
                type="text"
                placeholder="e.g. https://yourbrand.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value)
                  setError("")
                }}
                disabled={isAnalysing}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Brand description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Add any extra context about your brand, target audience, or what you'd like the quiz to explore..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isAnalysing}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isAnalysing || !url.trim()}
            >
              {isAnalysing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing your website...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Quiz Ideas
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isAnalysing && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">AI is working its magic</p>
              <p className="text-xs text-muted-foreground">
                Scanning your website, understanding your brand, and generating
                quiz concepts. This usually takes 15-30 seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
