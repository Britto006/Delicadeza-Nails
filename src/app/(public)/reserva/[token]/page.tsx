import { ManageBooking } from "@/components/public/ManageBooking";

// Área da cliente: gerenciar a própria reserva pelo link com o token.
export default async function ReservaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ManageBooking token={token} />;
}
