import { MovieDetailsClient } from '@/components/pages/movie-details-client';

export function generateStaticParams() {
  return [
    { slug: 'dune-part-two' },
    { slug: 'oppenheimer' },
    { slug: 'interstellar-imax' },
    { slug: 'cyber-odyssey-neon-protocol' },
    { slug: 'aurora-guardians-of-the-sky' },
  ];
}

export default function MovieDetailsPage({
  params,
}: {
  params: { slug: string };
}) {
  return <MovieDetailsClient slug={params.slug} />;
}
