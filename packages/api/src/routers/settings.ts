import { router, permissionProcedure } from "../trpc.js";
import { toMinor, toMajor } from "@workshop/core";
import { pricingSettingsSchema } from "@workshop/validators";
import {
  getPricingSettings,
  setPricingSettings,
  setOverridePassword,
} from "../services/settings.js";
import { audit } from "../services/audit.js";

export const settingsRouter = router({
  pricing: permissionProcedure("settings.pricing").query(async () => {
    const s = await getPricingSettings();
    return {
      machineRatePerHour: toMajor(s.machineRatePerHour),
      defaultLaborFee: toMajor(s.defaultLaborFee),
      defaultMarginPercent: s.defaultMarginPercent / 100,
      currency: s.currency,
    };
  }),

  setPricing: permissionProcedure("settings.pricing")
    .input(pricingSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      await setPricingSettings({
        machineRatePerHour: toMinor(input.machineRatePerHour),
        defaultLaborFee: toMinor(input.defaultLaborFee),
        defaultMarginPercent: Math.round(input.defaultMarginPercent * 100),
        currency: input.currency,
      });
      if (input.newOverridePassword) {
        await setOverridePassword(input.newOverridePassword);
      }
      await audit({ userId: ctx.user.id, action: "settings.pricing", entity: "Setting" });
      return { ok: true };
    }),
});
