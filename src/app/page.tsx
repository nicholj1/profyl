import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, BarChart3, Share2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">Profyl</span>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Turn your website into a{" "}
            <span className="text-primary">customer persona engine</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Profyl generates AI-powered quizzes from your website that collect
            behavioural insights and build customer personas automatically. No
            research skills needed.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">
                Create Your First Quiz
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              How it works
            </h2>
            <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">1. Paste your URL</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI analyses your website and generates tailored quiz
                  concepts for your brand.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">2. Share with customers</h3>
                <p className="text-sm text-muted-foreground">
                  Publish your quiz with a link or embed it on your site.
                  Customers get fun, personalised results.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">3. Get insights</h3>
                <p className="text-sm text-muted-foreground">
                  View response data, output distribution, and export everything
                  to CSV for deeper analysis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to understand your customers?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-muted-foreground">
              Create your first AI-powered quiz in minutes. No credit card
              required.
            </p>
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Profyl</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
