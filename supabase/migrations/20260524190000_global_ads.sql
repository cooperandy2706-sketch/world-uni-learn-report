-- Create global_ads table
CREATE TABLE public.global_ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  target_url text,
  active_from timestamp with time zone NOT NULL,
  active_until timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT global_ads_pkey PRIMARY KEY (id),
  CONSTRAINT global_ads_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

ALTER TABLE public.global_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_ads table
CREATE POLICY "Anyone can view active ads" 
ON public.global_ads FOR SELECT 
USING (is_active = true AND now() >= active_from AND now() <= active_until);

CREATE POLICY "Super admins can manage all global ads" 
ON public.global_ads 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Create storage bucket for global-ads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('global-ads', 'global-ads', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects (the files)
CREATE POLICY "Super admins can upload global ads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'global-ads' AND public.is_super_admin());

CREATE POLICY "Super admins can update global ads" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'global-ads' AND public.is_super_admin())
WITH CHECK (bucket_id = 'global-ads' AND public.is_super_admin());

CREATE POLICY "Super admins can delete global ads" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'global-ads' AND public.is_super_admin());

CREATE POLICY "Anyone can view global ads files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'global-ads');
