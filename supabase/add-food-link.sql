-- Add link column to food_research table
-- Run this in Supabase SQL Editor

ALTER TABLE food_research ADD COLUMN IF NOT EXISTS link TEXT;
