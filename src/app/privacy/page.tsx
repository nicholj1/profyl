import Link from "next/link"

export const metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
          <p>
            When you create an account, we collect your name, email address, and
            a securely hashed password. When you use Profyl to generate quizzes,
            we store your website URL and generated quiz content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Quiz respondent data</h2>
          <p>
            When someone takes a quiz, we collect their answers and, optionally,
            their email address if the quiz creator has enabled email capture. We
            also store a hashed (non-reversible) version of the respondent&apos;s
            IP address for fraud prevention. We do not store raw IP addresses.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">How we use your data</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide the Profyl service and generate quizzes</li>
            <li>To calculate and display quiz results</li>
            <li>To provide quiz creators with aggregated response analytics</li>
            <li>To communicate with you about your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Third-party services</h2>
          <p>
            We use Anthropic&apos;s Claude AI to generate quiz content. Website
            text submitted for analysis is sent to Anthropic&apos;s API. No
            personal data is shared with Anthropic.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
          <p>
            Under GDPR and UK Data Protection laws, you have the right to
            access, correct, or delete your personal data. Contact us to exercise
            these rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Data retention</h2>
          <p>
            Account data is retained while your account is active. Quiz response
            data is retained for the lifetime of the quiz. You can delete
            your quizzes at any time, which archives the associated data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Contact</h2>
          <p>
            For privacy enquiries, please contact us at{" "}
            <span className="text-foreground">privacy@profyl.app</span>.
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
