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
        'chef_western@gmail.com',
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
        'chef_asian@gmail.com',
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
        'chef_aussie@gmail.com',
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
        'customer1@gmail.com',
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
        'customer2@gmail.com',
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
        format('{"sub":"%s","email":"%s"}', chef_western_id::text, 'chef_western@gmail.com')::jsonb,
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
        format('{"sub":"%s","email":"%s"}', chef_asian_id::text, 'chef_asian@gmail.com')::jsonb,
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
        format('{"sub":"%s","email":"%s"}', chef_aussie_id::text, 'chef_aussie@gmail.com')::jsonb,
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
        format('{"sub":"%s","email":"%s"}', customer1_id::text, 'customer1@gmail.com')::jsonb,
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
        format('{"sub":"%s","email":"%s"}', customer2_id::text, 'customer2@gmail.com')::jsonb,
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
    contact_number = '0111111111',
    preferences = 'I believe that extraordinary cuisine begins with impeccable ingredients. After training under Michelin-starred mentors in Paris and Florence, I''ve dedicated my career to elevating classic French and Italian techniques with contemporary elegance. My passion lies in creating unforgettable dining experiences that honor tradition while embracing innovation. Each dish tells a story—my story—of culinary excellence forged through two decades of relentless pursuit of perfection.',
    avatar_url = 'https://images.unsplash.com/photo-1643834776503-891726ed42c6?q=80&w=3024'
WHERE id = chef_western_id;

-- Update Asian Chef's profile
UPDATE public.profiles
SET 
    display_name = 'Chef Ming',
    contact_number = '0222222222',
    preferences = 'My culinary journey began in the bustling kitchens of Hong Kong and took me through Tokyo, Bangkok, and Singapore, where I mastered the subtle art of balancing flavors across Asian traditions. I source rare ingredients directly from small producers across Asia to create truly authentic experiences. My philosophy embraces the heritage of Asian cuisine while reimagining possibilities with modern techniques. Every dish I create is a harmonious blend of respect for tradition and boundless creativity.',
    avatar_url = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=768'
WHERE id = chef_asian_id;

-- Update Australian Fusion Chef's profile
UPDATE public.profiles
SET 
    display_name = 'Chef Sydney',
    contact_number = '0333333333',
    preferences = 'As a sixth-generation Australian with deep respect for our indigenous food culture, I''ve made it my mission to showcase Australia''s unique native ingredients in extraordinary ways. I personally forage for rare bush tucker and work directly with Aboriginal communities to source ethical, sustainable produce. My cuisine represents the true essence of modern Australia—bold, innovative, and respectful of our diverse cultural heritage. Each plate celebrates the remarkable flavors found nowhere else on Earth.',
    avatar_url = 'https://images.unsplash.com/photo-1662126988549-a5ba05ff73c8?q=80&w=3087'
WHERE id = chef_aussie_id;

-- Update Customer 1's profile
UPDATE public.profiles
SET 
    display_name = 'Jane Smith',
    contact_number = '0123456789'
WHERE id = customer1_id;

-- Update Customer 2's profile
UPDATE public.profiles
SET 
    display_name = 'John Doe',
    contact_number = '0987654321'
WHERE id = customer2_id;

-- Add addresses for customers
INSERT INTO public.addresses (id, profile_id, address_line, city, state, zip_code, access_note, created_at)
VALUES
    -- Jane Smith addresses
    (
        'a1111111-1111-1111-1111-111111111111'::uuid,
        customer1_id,
        '42 Sunshine Avenue',
        'Brisbane',
        'QLD',
        '4000',
        'Knock on the blue door, building access code: 4231',
        current_timestamp
    ),
    (
        'a2222222-2222-2222-2222-222222222222'::uuid,
        customer1_id,
        '15 Coral Street',
        'Gold Coast',
        'QLD',
        '4217',
        'Call when you arrive, parking available in front',
        current_timestamp
    ),
    
    -- John Doe addresses
    (
        'a3333333-3333-3333-3333-333333333333'::uuid,
        customer2_id,
        '78 Reef Boulevard',
        'Cairns',
        'QLD',
        '4870',
        'Enter through side gate, delivery to back door please',
        current_timestamp
    ),
    (
        'a4444444-4444-4444-4444-444444444444'::uuid,
        customer2_id,
        '25 Palm Drive',
        'Townsville',
        'QLD',
        '4810',
        'Apartment 5B, buzz 5B for entry',
        current_timestamp
    );

-- Set default addresses for customers
UPDATE public.profiles
SET default_address = 'a1111111-1111-1111-1111-111111111111'::uuid
WHERE id = customer1_id;

UPDATE public.profiles
SET default_address = 'a3333333-3333-3333-3333-333333333333'::uuid
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