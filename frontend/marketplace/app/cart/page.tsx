import '../../global.css';
import Navbar from "@/components/navbar/Navbar";
import CartPageCompenent from '@/components/cart/cartComponent';

export default function CartPage() {
  return (
    <main className="home">
      <Navbar />
      <CartPageCompenent />
    </main>
  );
}