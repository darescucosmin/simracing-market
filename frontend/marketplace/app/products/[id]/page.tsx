"use client";

import Navbar from "@/components/navbar/Navbar";
import ProductDetailsPage from "@/components/productDetail/productDetail";
import { useParams } from "next/navigation";

export default function ProductsPageDetailed() {
  const params = useParams<{ id: string }>();

  return (
    <>
      <Navbar />
      <ProductDetailsPage params={{ id: params?.id ?? "" }} />
    </>
  );
}
