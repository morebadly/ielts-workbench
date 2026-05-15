-- supabase/schema.sql
-- ielts-workbench v1.8.0  Supabase 多设备同步 (last-write-wins per key)
-- 一次性贴到 Supabase SQL Editor 跑就行,可重复执行(全部 idempotent)。
-- v1.5 -> v1.8 升级:加了 client_modified_at 列,旧数据不会丢。

-- 1. 同步表:用户 + key 复合主键的 JSONB 存储
create table if not exists public.user_sync_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- 1a. v1.8 新增列:客户端记录的最后修改时间(用于 last-write-wins)
alter table public.user_sync_items
  add column if not exists client_modified_at timestamptz;

-- 2. 索引:按 updated_at 倒序拉最近变更
create index if not exists user_sync_items_user_updated_idx
  on public.user_sync_items (user_id, updated_at desc);

-- 2a. v1.8: 按 client_modified_at 排序的索引,加速冲突解决
create index if not exists user_sync_items_user_client_mod_idx
  on public.user_sync_items (user_id, client_modified_at desc);

-- 3. RLS
alter table public.user_sync_items enable row level security;

drop policy if exists "Users can read own sync items" on public.user_sync_items;
create policy "Users can read own sync items"
  on public.user_sync_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sync items" on public.user_sync_items;
create policy "Users can insert own sync items"
  on public.user_sync_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sync items" on public.user_sync_items;
create policy "Users can update own sync items"
  on public.user_sync_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own sync items" on public.user_sync_items;
create policy "Users can delete own sync items"
  on public.user_sync_items
  for delete
  using (auth.uid() = user_id);

-- 4. 触发器:每次 update 自动刷新 updated_at
create or replace function public.touch_user_sync_items()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_user_sync_items on public.user_sync_items;
create trigger touch_user_sync_items
before update on public.user_sync_items
for each row execute function public.touch_user_sync_items();
