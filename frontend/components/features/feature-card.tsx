import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, type LucideIcon } from "lucide-react";

/**
 * 機能カード（ダッシュボード用）
 */
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionText: string;
  variant?: "default" | "outline";
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  href, 
  actionText,
  variant = "default"
}: FeatureCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </div>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full" variant={variant}>
          <Link href={href}>
            {actionText}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
