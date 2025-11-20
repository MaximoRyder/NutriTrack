import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Logo textClassName="text-foreground" />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
