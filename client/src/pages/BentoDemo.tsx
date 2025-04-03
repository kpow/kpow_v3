import React from "react";
import BentoGridDemo from "@/components/ui/bento-grid-demo";
import { Helmet } from "react-helmet-async";

export default function BentoDemo() {
  return (
    <div className="container py-12 mx-auto">
      <Helmet>
        <title>Bento Grid Demo</title>
      </Helmet>
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4">Bento Grid Demo</h1>
        <p className="text-muted-foreground mx-auto">
          A flexible grid layout that showcases content in a visually appealing way
        </p>
      </div>
      
      <BentoGridDemo />
    </div>
  );
}