"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Download,
  Users,
  Mail,
  BarChart3,
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

interface ResultTypeBreakdown {
  id: string
  name: string
  colour: string | null
  count: number
  percentage: number
}

interface ResponseItem {
  id: string
  email: string | null
  resultType: {
    name: string
    colour: string | null
  } | null
  completedAt: string
}

interface Stats {
  totalResponses: number
  emailsCaptured: number
  breakdown: ResultTypeBreakdown[]
}

export default function ResponsesDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const quizId = params.id as string

  const [stats, setStats] = useState<Stats | null>(null)
  const [responseList, setResponseList] = useState<ResponseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/responses`)
      if (!res.ok) throw new Error("Failed to fetch responses")
      const data = await res.json()
      setStats(data.stats)
      setResponseList(data.responses)
    } catch {
      toast({
        title: "Error",
        description: "Failed to load response data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [quizId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleExport() {
    setIsExporting(true)
    try {
      const res = await fetch(
        `/api/quizzes/${quizId}/responses/export`
      )
      if (!res.ok) throw new Error("Failed to export")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download =
        res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") ||
        "responses.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exported",
        description: "Responses downloaded as CSV.",
      })
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export responses",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/quizzes/${quizId}/edit`)
          }
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quiz
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Responses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and export quiz response data
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || !stats || stats.totalResponses === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalResponses}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Responses
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.emailsCaptured}
                </p>
                <p className="text-xs text-muted-foreground">
                  Emails Captured
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.breakdown.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  Result Types
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result type breakdown */}
      {stats && stats.breakdown.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Result Distribution</CardTitle>
            <CardDescription>
              How respondents are distributed across result types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.breakdown.map((rt) => (
                <div key={rt.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: rt.colour || "#6C5CE7",
                        }}
                      />
                      <span className="font-medium">{rt.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {rt.count} ({rt.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${rt.percentage}%`,
                        backgroundColor: rt.colour || "#6C5CE7",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {responseList.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No responses yet. Share your quiz to start collecting data.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {responseList.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {r.email
                        ? r.email.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {r.email || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.completedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  {r.resultType && (
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: r.resultType.colour
                          ? `${r.resultType.colour}20`
                          : undefined,
                        color: r.resultType.colour || undefined,
                        borderColor: r.resultType.colour || undefined,
                      }}
                      className="border"
                    >
                      {r.resultType.name}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
