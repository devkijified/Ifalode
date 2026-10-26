-- 003: teacher title for white-label brand settings.
-- IfaLode is a platform: any Babalawo or Iyalorisa can run their own
-- house on it, so the teacher's title is data, not copy. The admin
-- brand editor writes it; the home teacher card renders it.
alter table public.brand_settings add column if not exists teacher_title text;
