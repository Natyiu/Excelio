import Link from "next/link";
import { BrandCardLayout } from "@/components/brand-card-layout";



export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandCardLayout mood="trophy" wide aside={<Link href="/" className="text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground">Back to home</Link>}>
      {children}
    </BrandCardLayout>
  );
}
