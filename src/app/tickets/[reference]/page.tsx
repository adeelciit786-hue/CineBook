import { TicketClient } from '@/components/pages/ticket-client';

export function generateStaticParams() {
  return [
    { reference: 'CB-DEMO01' },
    { reference: 'default' },
  ];
}

export default function DigitalTicketPage({
  params,
}: {
  params: { reference: string };
}) {
  return <TicketClient reference={params.reference} />;
}
