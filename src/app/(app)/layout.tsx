import { requireSession } from '@/utils/session';
import { AppShell } from '@/components/layout/AppShell';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  return <AppShell user={user}>{children}</AppShell>;
}
