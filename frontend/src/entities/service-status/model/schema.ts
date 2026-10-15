import { z } from 'zod';

export const serviceStatusSchema = z.object({
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string().nullable(),
  minAppVersion: z.string().nullable(),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

/** 빌드가 함께 내는 /version.json */
export const deployedVersionSchema = z.object({
  version: z.string(),
});
