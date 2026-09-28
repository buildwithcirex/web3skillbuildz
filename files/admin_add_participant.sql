-- Run this in your Supabase SQL Editor to allow Admins to add participants safely without needing the Service Role Key

CREATE OR REPLACE FUNCTION public.admin_add_allowed_email(
  p_email TEXT,
  p_name TEXT,
  p_phone TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- 1. Verify that the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin access required.';
  END IF;

  -- 2. Insert or update the allowed_emails table
  INSERT INTO public.allowed_emails (email, name, phone)
  VALUES (LOWER(TRIM(p_email)), TRIM(p_name), TRIM(p_phone))
  ON CONFLICT (email) DO UPDATE 
  SET name = EXCLUDED.name, phone = EXCLUDED.phone;
END;
$$;

-- Grant execution to authenticated users (the function internally verifies admin status)
GRANT EXECUTE ON FUNCTION public.admin_add_allowed_email(TEXT, TEXT, TEXT) TO authenticated;
