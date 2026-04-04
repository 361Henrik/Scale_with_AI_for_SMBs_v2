export function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-space-4 space-y-space-2 h-full">
      <h4 className="font-display text-lg font-medium text-foreground tracking-headline">
        {title}
      </h4>
      <p className="font-body text-sm text-muted-foreground leading-reading">
        {body}
      </p>
    </div>
  );
}
