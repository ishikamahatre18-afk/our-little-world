CREATE OR REPLACE FUNCTION public.new_invite_code() RETURNS text LANGUAGE plpgsql VOLATILE SET search_path TO 'public' AS $$
DECLARE alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; c text; i int;
BEGIN
  LOOP
    b := extensions.gen_random_bytes(8); c := '';
    FOR i IN 0..7 LOOP c := c || substr(alphabet, (get_byte(b,i) % 32) + 1, 1); END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.partner_invitations WHERE code = c);
  END LOOP;
  RETURN c;
END $$;
REVOKE ALL ON FUNCTION public.new_invite_code() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.partner_invitations ALTER COLUMN code SET DEFAULT public.new_invite_code();
UPDATE public.partner_invitations SET code = public.new_invite_code() WHERE status IN ('open','pending');

CREATE TABLE public.invite_join_attempts (user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.invite_join_attempts TO service_role;
ALTER TABLE public.invite_join_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX invite_join_attempts_user_time ON public.invite_join_attempts(user_id, created_at);

DROP FUNCTION public.join_partner_invitation(text);
CREATE FUNCTION public.join_partner_invitation(p_code text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE inv public.partner_invitations; clean text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'Sign in first'; END IF;
  IF (SELECT count(*) FROM public.invite_join_attempts WHERE user_id=auth.uid() AND created_at > now() - interval '1 hour') >= 10 THEN
    RETURN 'Too many attempts. Please wait an hour and try again.'; END IF;
  INSERT INTO public.invite_join_attempts(user_id) VALUES (auth.uid());
  clean := upper(regexp_replace(coalesce(p_code,''), '[^A-Za-z0-9]', '', 'g'));
  IF clean !~ '^[A-HJ-NP-Z2-9]{8}$' THEN RETURN 'Enter the 8-character code from your partner'; END IF;
  SELECT * INTO inv FROM public.partner_invitations WHERE code=clean FOR UPDATE;
  IF NOT FOUND OR inv.status<>'open' OR inv.expires_at<=now() THEN RETURN 'This code is invalid, expired, or already used'; END IF;
  IF inv.owner_id=auth.uid() THEN RETURN 'Use your partner''s code, not your own'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND name<>'' AND anniversary IS NOT NULL) THEN RETURN 'Complete your profile first'; END IF;
  IF public.my_relationship() IS NOT NULL THEN RETURN 'You already have a partner'; END IF;
  IF EXISTS(SELECT 1 FROM public.relationship_members WHERE user_id=inv.owner_id) THEN RETURN 'This code is invalid, expired, or already used'; END IF;
  IF EXISTS(SELECT 1 FROM public.partner_invitations WHERE (joiner_id=auth.uid() OR owner_id=auth.uid()) AND status='pending' AND expires_at>now()) THEN RETURN 'Resolve your existing request first'; END IF;
  DELETE FROM public.invite_join_attempts WHERE user_id=auth.uid();
  UPDATE public.partner_invitations SET joiner_id=auth.uid(), status='pending' WHERE id=inv.id;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.join_partner_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_partner_invitation(text) TO authenticated;