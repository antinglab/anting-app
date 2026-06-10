export function generateStaticParams() {
  return [{ id: 'index' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
