import { CheckoutClient } from '@/components/pages/checkout-client';

export function generateStaticParams() {
  return [
    { bookingId: 'bk-demo-checkout' },
    { bookingId: 'default' },
  ];
}

export default function CheckoutPage({
  params,
}: {
  params: { bookingId: string };
}) {
  return <CheckoutClient bookingId={params.bookingId} />;
}
