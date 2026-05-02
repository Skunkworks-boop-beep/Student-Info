# Release checklist (Supabase + Resend)

Use this before calling the product “production-ready” for a real launch.

## 1. Database

- [ ] Create a Supabase project (production and staging if possible).
- [ ] Run migrations **in order** in the SQL Editor:
  - `supabase/migrations/20260430120000_student_social_backend.sql`
  - `supabase/migrations/20260430140000_notification_triggers.sql`
  - `supabase/migrations/20260430150000_storage_media_workflow_rules.sql` (Storage bucket `complaint-media`, workflow rules table + RLS)
- [ ] Confirm RLS is enabled on all public tables (migrations should do this).
- [ ] Promote at least one staff account:  
  `update public.profiles set role = 'admin' where lower(username) = 'your_handle';`

## 2. Storage

- [ ] After `20260430150000`, confirm bucket `complaint-media` exists (migration inserts it).
- [ ] Smoke-test: submit a thought with an image; open the thread and verify the public URL loads.
- [ ] If the SPA is on a different origin than Supabase, confirm CORS allows your app origin for Storage (Supabase dashboard → Storage → configuration as applicable).

## 3. Auth

- [ ] **Email** provider enabled; set **Site URL** and **Redirect URLs** to your deployed app origin(s).
- [ ] Choose **one** path for auth email delivery:
  - **A (recommended for full control):** **Send Email** hook → deploy Edge Function `send-auth-email` and point the hook to  
    `https://<PROJECT_REF>.supabase.co/functions/v1/send-auth-email`  
    Deploy with:  
    `supabase functions deploy send-auth-email --no-verify-jwt`  
    Set secrets: `RESEND_API_KEY`, `SEND_EMAIL_HOOK_SECRET` (from Auth Hooks), `RESEND_FROM` (verified sender in Resend), optionally `APP_NAME`.
  - **B (simpler):** **Custom SMTP** in Supabase using [Resend SMTP](https://resend.com/docs/send-with-supabase-smtp) — then you do **not** need the send-email hook.

## 4. Resend

- [ ] Verify your sending domain (or use Resend’s test domain only for staging).
- [ ] Create API key; store only in Supabase Edge secrets or SMTP settings — **never** in `VITE_*` vars.

## 5. Frontend hosting (e.g. Vercel)

- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- [ ] Set `VITE_SUPPORT_EMAIL` if students should reach a real helpdesk from the Support page.
- [ ] Rebuild after env changes.

## 6. Smoke tests (live project, non-admin student)

- [ ] Sign up → receive confirmation / magic email (if confirmation on).
- [ ] Sign in → profile loads; dashboard and leaderboard show data.
- [ ] **Thoughts:** create thought (with optional media); list/detail; comment; upvote.
- [ ] **Map:** confirm heat reflects open thoughts (non-resolved) for your project.
- [ ] **Feed:** create post; like; open thread; comment.
- [ ] **Social:** follow / unfollow; notifications bell shows items after like, comment, follow (see triggers migration).
- [ ] **Admin (role = admin):** analytics reflects live counts; queue status changes persist and notify submitter; workflow rules CRUD works.

## 7. Known limitations (plan or accept)

- User roster emails in Admin → Users are placeholders unless you add a secure admin-only source tied to Auth.
- AI Assistant / floating help widget use preset UI copy; plug in your own model or ticketing when needed.

## 8. Security / compliance

- [ ] Review Supabase **Auth** rate limits and CAPTCHA if you face abuse.
- [ ] Privacy policy and data retention aligned with student data in `profiles`, `posts`, `complaints`, Storage objects.
- [ ] Production **anon** key is public by design; all protection is via RLS — avoid service role in the SPA.
