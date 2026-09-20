-- IBAN ile ödeme + dekont onayı (kitap mağazası sepet)
-- Çalıştırın: Supabase SQL Editor

alter table public.commerce_payments
  add column if not exists receipt_url text null,
  add column if not exists receipt_uploaded_at timestamptz null,
  add column if not exists receipt_note text null,
  add column if not exists review_note text null,
  add column if not exists reviewed_by text null references public.users (id) on delete set null,
  add column if not exists reviewed_at timestamptz null;

comment on column public.commerce_payments.receipt_url is 'IBAN ödemesi dekont dosya URL';
comment on column public.commerce_payments.review_note is 'Admin onay/red notu';
comment on column public.commerce_payments.provider is 'paytr | garanti | iban';

-- Paket atamasında hangi settten geldiğini izlemek için
alter table public.commerce_student_book_assignments
  add column if not exists package_id uuid null references public.commerce_book_packages (id) on delete set null;

create index if not exists idx_commerce_student_assignments_package
  on public.commerce_student_book_assignments (package_id)
  where deleted_at is null and package_id is not null;

-- meta jsonb zaten var; örnek:
-- { "payment_iban": "TR..", "payment_iban_holder": "Online VIP Dershane", "payment_iban_bank": "X Bank", "iban_payment_enabled": true }

-- Depolama: dekontlar (UUID path)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'commerce-iban-receipts',
  'commerce-iban-receipts',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Plan adı ile uyumluluk: alias bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'commerce-payment-receipts',
  'commerce-payment-receipts',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
