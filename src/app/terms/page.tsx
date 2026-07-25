import { Card, CardContent } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-black">Terms of Service</h1>
      <Card>
        <CardContent className="p-8 space-y-6 text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">1. Introduction</h2>
            <p>Welcome to CampusHub. By accessing our app, you agree to be bound by these terms.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">2. User Eligibility</h2>
            <p>Users must be at least 18 years old. We strictly enforce a "One Device, One Account" policy via Device ID tracking.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">3. Virtual Currency</h2>
            <p>Coins earned through tasks or missions have no external cash value until redeemed through the official withdrawal terminal.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">4. Fair Play</h2>
            <p>Any attempt to manipulate match scores, exploit referral systems, or bypass security restrictions will result in an immediate permanent ban.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
