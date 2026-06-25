import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
// C:\xampp\htdocs\shopsphere-main\shopsphere-main\frontend\app\about\page.tsx
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
