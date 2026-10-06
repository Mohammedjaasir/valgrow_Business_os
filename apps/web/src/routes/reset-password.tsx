import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const description = "Choose a new password for your ValGrow workspace account.";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Reset password · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Presentation-only form. Passwords are never submitted or stored."
      footer={
        <>
          Done?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Return to log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" placeholder="••••••••" />
          <Progress value={70} className="h-1" />
          <p className="text-xs text-muted-foreground">
            Use 12+ characters with a mix of letters, numbers and symbols.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input id="confirm" type="password" placeholder="••••••••" />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
