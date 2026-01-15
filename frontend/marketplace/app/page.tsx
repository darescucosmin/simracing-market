"use client";

import Navbar from "../components/navbar/Navbar";
import Hero from "../components/homepage/Hero";
import Footer from "../components/homepage/Footer";
import FeaturedProducts from "../components/homepage/FeaturedProducts";
import AboutSection from "@/components/about/about";


export default function HomePage() {
  return (
    <main className="home">
      <Navbar />
      <Hero />
      <FeaturedProducts />
      <AboutSection />
      <Footer />
    </main>
  );
}
