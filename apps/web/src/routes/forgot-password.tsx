import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const description = "Request a password reset link for your ValGrow workspace account.";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Forgot password · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your work email and we'll show the reset flow placeholder."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>
      <Alert>
        <MailCheck className="h-4 w-4" />
        <AlertTitle>Placeholder state</AlertTitle>
        <AlertDescription>
          No email is sent. Continue to the{" "}
          <Link to="/reset-password" className="font-medium text-primary hover:underline">
            reset password screen
          </Link>
          .
        </AlertDescription>
      </Alert>
    </AuthLayout>
  );
}
