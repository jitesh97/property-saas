"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MapPin, TrendingUp, Search } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function AnimatedFeatures() {
  return (
    <>
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comprehensive UK property data to make more accurate decisions
        </p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Property Search</CardTitle>
              <CardDescription>Advanced search with UK address autocomplete and postcode lookup</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Instant address suggestions", "Postcode validation", "Location-based filtering"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sold Price Analytics</CardTitle>
              <CardDescription>Comprehensive Land Registry data with detailed property transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Historical price trends", "Transaction details", "Market insights"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Area Intelligence</CardTitle>
              <CardDescription>Deep neighbourhood insights and property market understanding</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {["Local market data", "Price comparisons", "Investment potential"].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </>
  );
} 