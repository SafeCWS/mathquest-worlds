export function generateStaticParams() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(table => ({ table: String(table) }))
}

export default function MultiplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
