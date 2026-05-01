-- Idempotent storage policies for the existing public 'creatives' bucket.
-- The bucket itself already exists and is public; this only ensures the
-- access rules on storage.objects are present.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Creatives are public'
  ) THEN
    CREATE POLICY "Creatives are public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'creatives');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can upload creatives'
  ) THEN
    CREATE POLICY "Users can upload creatives"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'creatives'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can update own creatives'
  ) THEN
    CREATE POLICY "Users can update own creatives"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'creatives'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Users can delete own creatives'
  ) THEN
    CREATE POLICY "Users can delete own creatives"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'creatives'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
