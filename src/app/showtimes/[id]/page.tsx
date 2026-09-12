import { ShowtimeClient } from '@/components/pages/showtime-client';

export function generateStaticParams() {
  return [
    { id: 'st-dune-today-1' },
    { id: 'st-dune-today-2' },
    { id: 'st-dune-tomorrow-1' },
    { id: 'st-opp-today-1' },
    { id: 'st-opp-today-2' },
    { id: 'st-inter-today-1' },
  ];
}

export default function ShowtimeSeatSelectionPage({
  params,
}: {
  params: { id: string };
}) {
  return <ShowtimeClient id={params.id} />;
}
