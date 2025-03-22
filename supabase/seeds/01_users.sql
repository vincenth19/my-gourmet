-- File: supabase/seeds/01_users.sql

-- Create Chef and Customer Users with proper auth setup
-- First, insert into auth.users table with all required fields

-- Generate UUIDs for our users
DO $$
DECLARE
    chef_western_id UUID := '11111111-1111-1111-1111-111111111111';
    chef_asian_id UUID := '22222222-2222-2222-2222-222222222222';
    chef_aussie_id UUID := '33333333-3333-3333-3333-333333333333';
    customer1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    customer2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN

-- CHEFS and CUSTOMERS - auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
)
VALUES
    -- Western Chef
    (
        '00000000-0000-0000-0000-000000000000',
        chef_western_id,
        'authenticated',
        'authenticated',
        'chef_western@mygourmet.com',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Chef Gordon","contact_number":"555-1001","role":"chef"}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    ),
    -- Asian Chef
    (
        '00000000-0000-0000-0000-000000000000',
        chef_asian_id,
        'authenticated',
        'authenticated',
        'chef_asian@mygourmet.com',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Chef Ming","contact_number":"555-1002","role":"chef"}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    ),
    -- Australian Fusion Chef
    (
        '00000000-0000-0000-0000-000000000000',
        chef_aussie_id,
        'authenticated',
        'authenticated',
        'chef_aussie@mygourmet.com',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Chef Sydney","contact_number":"555-1003","role":"chef"}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    ),
    -- Customer 1
    (
        '00000000-0000-0000-0000-000000000000',
        customer1_id,
        'authenticated',
        'authenticated',
        'customer1@mygourmet.com',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Jane Smith","contact_number":"555-2001","role":"customer"}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    ),
    -- Customer 2
    (
        '00000000-0000-0000-0000-000000000000',
        customer2_id,
        'authenticated',
        'authenticated',
        'customer2@mygourmet.com',
        crypt('password123', gen_salt('bf')),
        current_timestamp,
        current_timestamp,
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"John Doe","contact_number":"555-2002","role":"customer"}',
        current_timestamp,
        current_timestamp,
        '',
        '',
        '',
        ''
    );

-- Create identity records for each user
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES
    -- Western Chef
    (
        uuid_generate_v4(),
        chef_western_id,
        format('{"sub":"%s","email":"%s"}', chef_western_id::text, 'chef_western@mygourmet.com')::jsonb,
        'email',
        chef_western_id::text,
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    -- Asian Chef
    (
        uuid_generate_v4(),
        chef_asian_id,
        format('{"sub":"%s","email":"%s"}', chef_asian_id::text, 'chef_asian@mygourmet.com')::jsonb,
        'email',
        chef_asian_id::text,
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    -- Australian Fusion Chef
    (
        uuid_generate_v4(),
        chef_aussie_id,
        format('{"sub":"%s","email":"%s"}', chef_aussie_id::text, 'chef_aussie@mygourmet.com')::jsonb,
        'email',
        chef_aussie_id::text,
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    -- Customer 1
    (
        uuid_generate_v4(),
        customer1_id,
        format('{"sub":"%s","email":"%s"}', customer1_id::text, 'customer1@mygourmet.com')::jsonb,
        'email',
        customer1_id::text,
        current_timestamp,
        current_timestamp,
        current_timestamp
    ),
    -- Customer 2
    (
        uuid_generate_v4(),
        customer2_id,
        format('{"sub":"%s","email":"%s"}', customer2_id::text, 'customer2@mygourmet.com')::jsonb,
        'email',
        customer2_id::text,
        current_timestamp,
        current_timestamp,
        current_timestamp
    );

-- Create profiles for each user (this will trigger the handle_new_user function)
-- Since we already have a trigger function for creating profiles, we don't need to insert directly
-- However, we need to update some specific fields manually

-- Update Western Chef's profile
UPDATE public.profiles
SET 
    display_name = 'Chef Gordon',
    preferences = 'I believe that extraordinary cuisine begins with impeccable ingredients. After training under Michelin-starred mentors in Paris and Florence, I''ve dedicated my career to elevating classic French and Italian techniques with contemporary elegance. My passion lies in creating unforgettable dining experiences that honor tradition while embracing innovation. Each dish tells a story—my story—of culinary excellence forged through two decades of relentless pursuit of perfection.'
WHERE id = chef_western_id;

-- Update Asian Chef's profile
UPDATE public.profiles
SET 
    display_name = 'Chef Ming',
    preferences = 'My culinary journey began in the bustling kitchens of Hong Kong and took me through Tokyo, Bangkok, and Singapore, where I mastered the subtle art of balancing flavors across Asian traditions. I source rare ingredients directly from small producers across Asia to create truly authentic experiences. My philosophy embraces the heritage of Asian cuisine while reimagining possibilities with modern techniques. Every dish I create is a harmonious blend of respect for tradition and boundless creativity.'
WHERE id = chef_asian_id;

-- Update Australian Fusion Chef's profile
UPDATE public.profiles
SET 
    display_name = 'Chef Sydney',
    preferences = 'As a sixth-generation Australian with deep respect for our indigenous food culture, I''ve made it my mission to showcase Australia''s unique native ingredients in extraordinary ways. I personally forage for rare bush tucker and work directly with Aboriginal communities to source ethical, sustainable produce. My cuisine represents the true essence of modern Australia—bold, innovative, and respectful of our diverse cultural heritage. Each plate celebrates the remarkable flavors found nowhere else on Earth.'
WHERE id = chef_aussie_id;

-- Update Customer 1's profile
UPDATE public.profiles
SET 
    display_name = 'Jane Smith'
WHERE id = customer1_id;

-- Update Customer 2's profile
UPDATE public.profiles
SET 
    display_name = 'John Doe'
WHERE id = customer2_id;

-- Add payment methods for customers
INSERT INTO public.payment_methods (profile_id, method_type, card_number, expiry_date, cvv, name_on_card)
VALUES
    (
        customer1_id,
        'card',
        '4242424242424242',
        '10/28',
        '123',
        'Jane Smith'
    ),
    (
        customer2_id,
        'card',
        '4242424242424242',
        '10/28',
        '123',
        'John Doe'
    );

END $$;