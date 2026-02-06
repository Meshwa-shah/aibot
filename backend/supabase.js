import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js/dist/index.cjs';

dotenv.config();

export const supabase = createClient(process.env.SUP_URL, process.env.SUP_KEY);