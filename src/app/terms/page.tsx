import Link from "next/link"

export const metadata = {
  title: "Terms of Service",
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Service description</h2>
          <p>
            Profyl is a SaaS platform that enables businesses to create
            AI-powered personality quizzes from their website content. These
            quizzes help collect behavioural and psychographic insights about
            their audience.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Acceptable use</h2>
          <p>You agree not to use Profyl to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Create quizzes containing harmful, illegal, or discriminatory content</li>
            <li>Collect personal data without proper legal basis</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Attempt to reverse-engineer or abuse the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">AI-generated content</h2>
          <p>
            Quiz content is generated using AI and is provided as a starting
            point. You are responsible for reviewing and editing all generated
            content before publishing. Profyl does not guarantee the accuracy or
            suitability of AI-generated content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Data ownership</h2>
          <p>
            You retain ownership of your quiz content and response data. By
            using Profyl, you grant us a licence to store and process this data
            to provide the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Limitation of liability</h2>
          <p>
            Profyl is provided &quot;as is&quot; without warranties. We are not
            liable for any damages arising from your use of the service,
            including but not limited to loss of data or business interruption.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Changes to terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the
            service after changes constitutes acceptance of the updated terms.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="text-sm text-primary hover:underline"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  )
}
