import { z } from 'zod';

export const serviceStatusSchema = z.object({
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string().nullable(),
  minAppVersion: z.string().nullable(),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
