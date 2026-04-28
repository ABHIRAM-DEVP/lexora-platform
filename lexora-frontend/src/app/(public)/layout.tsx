import { AuroraBackground } from "@/components/AuroraBackground";
import { Navbar } from "@/components/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuroraBackground />
      <Navbar />
      <div className="pt-[72px]">{children}</div>
    </>
  );
}
