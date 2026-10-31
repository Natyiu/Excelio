import { redirect } from "next/navigation";
import { Paywall } from "@/components/paywall";
import { getProProducts, hasPro } from "@/lib/pro-access";

/** Go Pro from anywhere (the landing page's pricing links here). */
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  if (await hasPro()) redirect("/dashboard/pro" as never);
  const { billing } = await searchParams;
  return (
    <Paywall
      products={await getProProducts()}
      initialBilling={billing === "monthly" || billing === "lifetime" ? billing : "yearly"}
      heading="Go Pro"
      sub="Unlock every chapter, from your first formula all the way to LAMBDA."
    />
  );
}
