import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-black">Privacy Policy</h1>
      <Card>
        <CardContent className="p-8 space-y-6 text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Data Collection</h2>
            <p>We collect mobile numbers for phone verification and unique Device IDs (IMEI/Android ID) to ensure platform security and prevent multiple account creation.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Third-Party Integration</h2>
            <p>Our Offer Wall is provided by CPA Lead. They may collect separate data according to their own privacy policies when you interact with their offers.</p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Data Protection</h2>
            <p>We use industry-standard encryption and Firebase security rules to protect your personal and financial data from unauthorized access.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
