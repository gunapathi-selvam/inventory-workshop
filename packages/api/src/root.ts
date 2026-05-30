import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { userRouter } from "./routers/user.js";
import { customerRouter } from "./routers/customer.js";
import { filamentRouter } from "./routers/filament.js";
import { orderRouter } from "./routers/order.js";
import { pricingRouter } from "./routers/pricing.js";
import { discountRouter } from "./routers/discount.js";
import { permissionRouter } from "./routers/permission.js";
import { fieldRouter } from "./routers/field.js";
import { notificationRouter } from "./routers/notification.js";
import { dashboardRouter } from "./routers/dashboard.js";
import { settingsRouter } from "./routers/settings.js";

/** The single app router — one sub-router (controller) per domain. */
export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  customer: customerRouter,
  filament: filamentRouter,
  order: orderRouter,
  pricing: pricingRouter,
  discount: discountRouter,
  permission: permissionRouter,
  field: fieldRouter,
  notification: notificationRouter,
  dashboard: dashboardRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
