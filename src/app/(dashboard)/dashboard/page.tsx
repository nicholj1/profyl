import Link from "next/link"
import { redirect } from "next/navigation"
import { eq, sql } from "drizzle-orm"
import { Plus, FileText } from "lucide-react"
import { db } from "@/db"
import { quizzes } from "@/db/schema"
import { requireWorkspace } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  let workspace
  try {
    workspace = await requireWorkspace()
  } catch {
    redirect("/login")
  }

  // Fetch quizzes with response counts
  const quizList = await db
    .select({
      id: quizzes.id,
      title: quizzes.title,
      slug: quizzes.slug,
      status: quizzes.status,
      createdAt: quizzes.createdAt,
      responseCount: sql<number>`(
        SELECT COUNT(*)::int FROM responses WHERE responses.quiz_id = ${quizzes.id} AND responses.completed_at IS NOT NULL
      )`,
    })
    .from(quizzes)
    .where(eq(quizzes.workspaceId, workspace.id))
    .orderBy(sql`${quizzes.createdAt} DESC`)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your customer insight quizzes
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Quiz
          </Link>
        </Button>
      </div>

      {quizList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mb-2 text-lg">No quizzes yet</CardTitle>
            <CardDescription className="mb-6 text-center">
              Create your first quiz to start collecting customer insights.
              <br />
              Just paste your website URL and our AI does the rest.
            </CardDescription>
            <Button asChild>
              <Link href="/dashboard/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizList.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/dashboard/quizzes/${quiz.id}/edit`}
              className="block"
            >
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{quiz.title}</h3>
                      <Badge
                        variant={
                          quiz.status === "live" ? "default" : "secondary"
                        }
                      >
                        {quiz.status === "live" ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created{" "}
                      {new Date(quiz.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {quiz.responseCount}
                    </p>
                    <p className="text-xs text-muted-foreground">responses</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
