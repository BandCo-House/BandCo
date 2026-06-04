import type { z } from 'zod';
import { practiceRecordSchema } from './schema';

export type PracticeRecord = z.infer<typeof practiceRecordSchema>;
