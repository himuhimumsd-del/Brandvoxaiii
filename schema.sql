-- BrandVox AI - Database Schema (Supabase PostgreSQL)
-- Modified for Razorpay (INR) and ₹50 Free Signup Credits

-- Drop tables if they exist (for clean setup)
drop table if exists public.platform_settings cascade;
drop table if exists public.upi_submissions cascade;
drop table if exists public.notifications cascade;
drop table if exists public.transactions cascade;
drop table if exists public.generations cascade;
drop table if exists public.models cascade;
drop table if exists public.profiles cascade;

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin')),
  credits numeric default 50.00 check (credits >= 0),
  total_spent numeric default 0 check (total_spent >= 0),
  total_videos integer default 0 check (total_videos >= 0),
  is_banned boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Models config table (admin controlled)
create table public.models (
  id text primary key,
  name text not null,
  provider text not null,
  fal_endpoint text not null,
  description text,
  price_per_second numeric not null check (price_per_second >= 0),
  max_duration integer default 15 check (max_duration > 0),
  supported_resolutions text[] default array['480p','720p'],
  supported_aspects text[] default array['16:9','9:16','1:1'],
  supports_audio boolean default true,
  supports_image_input boolean default false,
  is_active boolean default true,
  is_featured boolean default false,
  badge text,
  created_at timestamp with time zone default now()
);

-- Video generations table
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  prompt text not null,
  model_id text not null references public.models(id) on delete restrict,
  model_name text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  video_url text,
  thumbnail_url text,
  duration integer,
  resolution text,
  aspect_ratio text,
  cost numeric check (cost >= 0),
  fal_request_id text,
  error_message text,
  is_public boolean default false,
  created_at timestamp with time zone default now()
);

-- Credit transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('purchase', 'usage', 'refund', 'admin_grant')),
  amount numeric not null,
  description text,
  gateway_payment_id text,
  gateway_order_id text,
  gateway_name text default 'cashfree',
  generation_id uuid references public.generations(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info','success','warning','error')),
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Insert default models with INR pricing:
-- WAN 2.2: ₹15/sec
-- Seedance Fast: ₹45/sec
-- Seedance Quality: ₹60/sec
insert into public.models (id, name, provider, fal_endpoint, description, price_per_second, max_duration, supported_resolutions, supported_aspects, supports_audio, supports_image_input, is_active, is_featured, badge, created_at) values
('seedance-2-fast', 'Seedance 2.0 Fast', 'ByteDance', 'bytedance/seedance-2.0/fast/text-to-video', 'Fastest cinematic video with native audio', 45.00, 15, array['480p','720p'], array['16:9','9:16','1:1','4:3'], true, false, true, false, 'Fastest', now()),
('seedance-2', 'Seedance 2.0', 'ByteDance', 'bytedance/seedance-2.0/text-to-video', 'Highest quality cinematic video generation', 60.00, 15, array['480p','720p'], array['16:9','9:16','1:1','4:3'], true, false, true, true, 'Quality', now()),
('seedance-2-i2v', 'Seedance 2.0 Image-to-Video', 'ByteDance', 'bytedance/seedance-2.0/image-to-video', 'Animate any image into cinematic video', 60.00, 15, array['480p','720p'], array['16:9','9:16','1:1','4:3'], true, true, true, false, 'Image→Video', now());

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.transactions enable row level security;
alter table public.models enable row level security;
alter table public.notifications enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own generations" on public.generations for select using (auth.uid() = user_id);
create policy "Users can insert own generations" on public.generations for insert with check (auth.uid() = user_id);
create policy "Users can delete own generations" on public.generations for delete using (auth.uid() = user_id);
create policy "Users can update own generations" on public.generations for update using (auth.uid() = user_id);
create policy "Everyone can view public generations" on public.generations for select using (is_public = true);

create policy "Users can view own transactions" on public.transactions for select using (auth.uid() = user_id);

create policy "Everyone can view active models" on public.models for select using (is_active = true);
create policy "Admins can do everything on models" on public.models for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Function to auto-create profile on signup with ₹50 free credit transaction
create or replace function public.handle_new_user()
returns trigger as $$
declare
  fullName text;
  avatarUrl text;
begin
  fullName := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
  avatarUrl := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '');
  
  -- Insert profile with 50 credits
  insert into public.profiles (id, email, full_name, avatar_url, role, credits)
  values (new.id, new.email, fullName, avatarUrl, 'user', 50.00);

  -- Log welcome credits transaction
  insert into public.transactions (user_id, type, amount, description)
  values (new.id, 'admin_grant', 50.00, 'Welcome free signup credits (one-time bonus)');

  -- Insert welcome notification
  insert into public.notifications (user_id, title, message, type)
  values (new.id, 'Welcome to BrandVox AI!', 'You have been granted ₹50.00 free credits to start generating cinematic videos!', 'success');

  return new;
exception
  when others then
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- UPI manual payment verification submissions table
create table public.upi_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  email text not null,
  utr_id text unique not null,
  package_id text not null,
  amount numeric not null,
  screenshot_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.upi_submissions enable row level security;

-- Policies for upi_submissions
create policy "Users can view own upi submissions" on public.upi_submissions
  for select using (auth.uid() = user_id);

create policy "Users can insert own upi submissions" on public.upi_submissions
  for insert with check (auth.uid() = user_id);

create policy "Admins can manage all upi submissions" on public.upi_submissions
  for all using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Platform settings table
create table public.platform_settings (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default now()
);

insert into public.platform_settings (key, value) values
  ('platformName', 'BrandVox AI'),
  ('welcomeCredits', '50.00'),
  ('maxFreeGenerationsPerDay', '5'),
  ('maintenanceMode', 'false'),
  ('allowPublicSignups', 'true'),
  ('smtpFromAddress', 'noreply@brandvox.ai')
on conflict (key) do nothing;

grant all on public.platform_settings to authenticated, service_role;

-- Database schema privileges and grants for Supabase API roles
-- Grant schema access
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables in public schema to all roles
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;

-- Ensure default privileges are set for future tables
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
