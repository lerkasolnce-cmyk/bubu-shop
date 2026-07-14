"use client";

import { useState } from "react";
import QuantityStepper from "./QuantityStepper";
import AddToCartButton from "./AddToCartButton";
import BuyNowButton from "./BuyNowButton";

export default function BuyBox({
  slug,
  disabled,
  labels,
}: {
  slug: string;
  disabled?: boolean;
  labels: {
    addToCart: string;
    buyNow: string;
    decreaseQty?: string;
    increaseQty?: string;
  };
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      <QuantityStepper
        value={qty}
        onChange={setQty}
        disabled={disabled}
        decreaseLabel={labels.decreaseQty}
        increaseLabel={labels.increaseQty}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <AddToCartButton slug={slug} label={labels.addToCart} disabled={disabled} quantity={qty} />
        <BuyNowButton slug={slug} label={labels.buyNow} disabled={disabled} quantity={qty} />
      </div>
    </div>
  );
}
