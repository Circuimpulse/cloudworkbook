import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 統計カード（ダッシュボード用）
 */
interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
