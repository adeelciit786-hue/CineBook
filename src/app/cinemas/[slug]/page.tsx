import { CinemaDetailsClient } from '@/components/pages/cinema-details-client';

export function generateStaticParams() {
  return [
    { slug: 'cinebook-grand-imax' },
    { slug: 'cinebook-sunset-luxe' },
  ];
}

export default function CinemaDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return <CinemaDetailsClient slug={params.slug} />;
}
