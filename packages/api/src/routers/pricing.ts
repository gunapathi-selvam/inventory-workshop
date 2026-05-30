import { router, permissionProcedure } from "../trpc.js";
import { pricePreviewSchema } from "@workshop/validators";
import { computePricing } from "../services/pricing.js";

export const pricingRouter = router({
  /** Live price preview for the order wizard. Does not verify the override
   *  password (no persistence) but still reports overrideUsed. */
  preview: permissionProcedure("orders.create")
    .input(pricePreviewSchema)
    .mutation(async ({ input }) => {
      const result = await computePricing(input, { enforceOverride: false });
      return result;
    }),
});
