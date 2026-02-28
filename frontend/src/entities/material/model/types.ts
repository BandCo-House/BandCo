import type { z } from 'zod';
import { fileMaterialSchema, videoMaterialSchema } from './schema';

export type FileMaterial = z.infer<typeof fileMaterialSchema>;
export type VideoMaterial = z.infer<typeof videoMaterialSchema>;
