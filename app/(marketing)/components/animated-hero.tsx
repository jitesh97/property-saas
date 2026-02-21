"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function AnimatedHero() {
  const userTypes = ["homebuyers", "investors", "renters"];
  const [currentUserType, setCurrentUserType] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUserType((prev) => (prev + 1) % userTypes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      className="text-center space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Your one stop shop for UK property data for{" "}
        <div className="inline-block min-w-[200px] md:min-w-[300px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={userTypes[currentUserType]}
              className="text-primary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {userTypes[currentUserType]}
            </motion.span>
          </AnimatePresence>
        </div>
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
        Make more accurate property decisions with comprehensive UK property data and insights
      </p>
      <div className="flex justify-center gap-4 pt-6">
        <Button asChild size="lg" className="font-medium">
          <Link href="/dashboard">
            Start Hunting <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
} 