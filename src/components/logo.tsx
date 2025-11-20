import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Leaf className="h-6 w-6 text-primary" />
      <h1 className={cn("font-headline text-xl font-semibold", textClassName)}>NutriTrack Pro</h1>
    </div>
  );
}
