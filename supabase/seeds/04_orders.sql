-- File: supabase/seeds/04_orders.sql

-- Seed file for creating orders for testing the application
-- Creates 5 orders for each customer with different statuses
-- and distributes them among chefs as specified
DO $$
DECLARE
    -- User IDs
    chef_western_id UUID := '11111111-1111-1111-1111-111111111111';
    chef_asian_id UUID := '22222222-2222-2222-2222-222222222222';
    chef_sydney_id UUID := '33333333-3333-3333-3333-333333333333';
    customer1_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    customer2_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    
    -- Dish IDs for each chef (using the first two dishes from each chef)
    chef_western_dish1 UUID;
    chef_western_dish2 UUID;
    chef_asian_dish1 UUID;
    chef_asian_dish2 UUID;
    chef_sydney_dish1 UUID;
    chef_sydney_dish2 UUID;
    
    -- Address IDs
    customer1_address UUID := 'a1111111-1111-1111-1111-111111111111';
    customer2_address UUID := 'a3333333-3333-3333-3333-333333333333';
    
    -- Order IDs
    -- Customer 1 Orders
    customer1_pending_id UUID := uuid_generate_v4();
    customer1_completed1_id UUID := uuid_generate_v4();
    customer1_completed2_id UUID := uuid_generate_v4();
    customer1_rejected_id UUID := uuid_generate_v4();
    customer1_cancelled_id UUID := uuid_generate_v4();
    
    -- Customer 2 Orders
    customer2_pending_id UUID := uuid_generate_v4();
    customer2_completed1_id UUID := uuid_generate_v4();
    customer2_completed2_id UUID := uuid_generate_v4();
    customer2_rejected_id UUID := uuid_generate_v4();
    customer2_cancelled_id UUID := uuid_generate_v4();
    
    -- Variables for customer details
    customer1_name VARCHAR;
    customer1_email VARCHAR;
    customer1_phone VARCHAR;
    customer1_address_line VARCHAR;
    customer1_city VARCHAR;
    customer1_state VARCHAR;
    customer1_zip VARCHAR;
    customer1_access_note TEXT;
    
    customer2_name VARCHAR;
    customer2_email VARCHAR;
    customer2_phone VARCHAR;
    customer2_address_line VARCHAR;
    customer2_city VARCHAR;
    customer2_state VARCHAR;
    customer2_zip VARCHAR;
    customer2_access_note TEXT;
    
    -- Chef names
    chef_western_name VARCHAR;
    chef_asian_name VARCHAR;
    chef_sydney_name VARCHAR;
    
    -- Reference date (March 29, 2025 11:57 PM)
    reference_date TIMESTAMP := CURRENT_TIMESTAMP;
    
BEGIN
    -- Fetch the first two dishes for each chef
    SELECT id INTO chef_western_dish1 FROM public.dishes WHERE chef_id = chef_western_id LIMIT 1;
    SELECT id INTO chef_western_dish2 FROM public.dishes WHERE chef_id = chef_western_id OFFSET 1 LIMIT 1;
    
    SELECT id INTO chef_asian_dish1 FROM public.dishes WHERE chef_id = chef_asian_id LIMIT 1;
    SELECT id INTO chef_asian_dish2 FROM public.dishes WHERE chef_id = chef_asian_id OFFSET 1 LIMIT 1;
    
    SELECT id INTO chef_sydney_dish1 FROM public.dishes WHERE chef_id = chef_sydney_id LIMIT 1;
    SELECT id INTO chef_sydney_dish2 FROM public.dishes WHERE chef_id = chef_sydney_id OFFSET 1 LIMIT 1;
    
    -- Get customer details
    SELECT display_name, email, contact_number INTO customer1_name, customer1_email, customer1_phone
    FROM public.profiles WHERE id = customer1_id;
    
    SELECT display_name, email, contact_number INTO customer2_name, customer2_email, customer2_phone
    FROM public.profiles WHERE id = customer2_id;
    
    -- Get address details
    SELECT address_line, city, state, zip_code, access_note INTO customer1_address_line, customer1_city, customer1_state, customer1_zip, customer1_access_note
    FROM public.addresses WHERE id = customer1_address;
    
    SELECT address_line, city, state, zip_code, access_note INTO customer2_address_line, customer2_city, customer2_state, customer2_zip, customer2_access_note
    FROM public.addresses WHERE id = customer2_address;
    
    -- Get chef names
    SELECT display_name INTO chef_western_name FROM public.profiles WHERE id = chef_western_id;
    SELECT display_name INTO chef_asian_name FROM public.profiles WHERE id = chef_asian_id;
    SELECT display_name INTO chef_sydney_name FROM public.profiles WHERE id = chef_sydney_id;
    
    -- Create orders for customer 1
    
    -- 1. PENDING order with chef_western (including custom dish) - FUTURE PENDING ORDER
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time,
        is_hidden
    ) VALUES (
        customer1_pending_id, 
        customer1_id, 
        customer1_email, 
        customer1_phone, 
        chef_western_id, 
        chef_western_name,
        customer1_address_line, 
        customer1_city, 
        customer1_state, 
        customer1_zip,
        customer1_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date, 
        'pending', 
        'paid', 
        125.75, 
        false, 
        reference_date + interval '2 days' + interval '4 hours',
        true
    );
    
    -- Add a regular dish to the pending order
    INSERT INTO public.order_dishes (
        order_id, dish_id, chef_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_pending_id,
        (SELECT id FROM public.dishes WHERE name = 'Beef Wellington' AND chef_id = chef_western_id LIMIT 1),
        chef_western_id,
        'Beef Wellington',
        1,
        58.99,
        '{"option": ["Medium Rare", "Black truffle supplement"]}'
    );
    
    -- Add a custom dish to the pending order
    INSERT INTO public.order_dishes (
        order_id, dish_id, chef_id, dish_name, quantity, dish_price, custom_dish_name, custom_description, dish_note
    ) VALUES (
        customer1_pending_id,
        NULL, -- Custom dish has no dish_id reference
        chef_western_id,
        'Custom Dish Request',
        1,
        0.00,  -- Price will be set by chef later
        'Truffle Pasta Special',
        'Homemade pasta with black truffle sauce, using seasonal truffles. Prefer a creamy base and fresh parmesan.',
        'I have a mild garlic allergy, please use minimal garlic'
    );
    
    -- 2. ACCEPTED order with chef_western (PAST ORDER 1)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer1_completed1_id, 
        customer1_id, 
        customer1_email, 
        customer1_phone, 
        chef_western_id, 
        chef_western_name,
        customer1_address_line, 
        customer1_city, 
        customer1_state, 
        customer1_zip,
        customer1_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '3 days', 
        'accepted', 
        'paid', 
        86.50, 
        true, 
        reference_date + interval '2 days' + interval '3 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_id, chef_id, dish_name, quantity, dish_price, customization_options, dish_types
    ) VALUES (
        customer1_completed1_id,
        (SELECT id FROM public.dishes WHERE name = 'Spaghetti Carbonara' AND chef_id = chef_western_id LIMIT 1),
        chef_western_id,
        'Spaghetti Carbonara',
        2,
        36.50,
        '{"option": ["Extra pancetta", "Al dente", "Extra cheese"]}',
        '{"types": ["Al dente"]}'
    );
    
    -- Add a custom dish to the accepted order (with chef-assigned price)
    INSERT INTO public.order_dishes (
        order_id, dish_id, chef_id, dish_name, quantity, dish_price, custom_dish_name, custom_description, custom_price, dish_types
    ) VALUES (
        customer1_completed1_id,
        NULL, -- Custom dish has no dish_id reference
        chef_western_id,
        'Custom Dish Request',
        1,
        65.00,
        'Seafood Risotto Special',
        'A creamy risotto with mixed seafood, especially scallops and prawns.',
        65.00,
        '{"types": []}'
    );
    
    -- 3. ACCEPTED order with chef_sydney (PAST ORDER 2)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer1_completed2_id, 
        customer1_id, 
        customer1_email, 
        customer1_phone, 
        chef_sydney_id, 
        chef_sydney_name,
        customer1_address_line, 
        customer1_city, 
        customer1_state, 
        customer1_zip,
        customer1_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '5 days', 
        'accepted', 
        'paid', 
        97.48, 
        false, 
        reference_date - interval '5 days' + interval '8 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_id, chef_id, dish_name, quantity, dish_price, customization_options
    ) VALUES 
    (
        customer1_completed2_id,
        (SELECT id FROM public.dishes WHERE name = 'Barramundi with Bush Tucker' AND chef_id = chef_sydney_id LIMIT 1),
        chef_sydney_id,
        'Barramundi with Bush Tucker',
        1,
        52.50,
        '{"option": ["Davidson plum sauce", "Extra crispy skin", "Lemon wedge"]}'
    ),
    (
        customer1_completed2_id,
        (SELECT id FROM public.dishes WHERE name = 'Emu Burger with Beetroot' AND chef_id = chef_sydney_id LIMIT 1),
        chef_sydney_id,
        'Emu Burger with Beetroot',
        1,
        38.75,
        '{"option": ["Add cheese", "Gluten-free bun"]}'
    );
    
    -- 4. ACCEPTED order with chef_asian (PAST ORDER 3)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer1_rejected_id, 
        customer1_id, 
        customer1_email, 
        customer1_phone, 
        chef_asian_id, 
        chef_asian_name,
        customer1_address_line, 
        customer1_city, 
        customer1_state, 
        customer1_zip,
        customer1_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '1 day', 
        'accepted', 
        'paid', 
        68.00, 
        true, 
        reference_date - interval '1 day' + interval '6 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_rejected_id,
        'Peking Duck',
        1,
        68.00,
        '{"option": ["Extra pancakes", "Extra crispy skin", "Spring onion garnish"]}'
    );
    
    -- 5. ACCEPTED order with chef_sydney (FUTURE ACCEPTED ORDER)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer1_cancelled_id, 
        customer1_id, 
        customer1_email, 
        customer1_phone, 
        chef_sydney_id, 
        chef_sydney_name,
        customer1_address_line, 
        customer1_city, 
        customer1_state, 
        customer1_zip,
        customer1_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date, 
        'accepted', 
        'paid', 
        121.98,
        false, 
        reference_date + interval '1 day' + interval '2 hours'
    );
    
    -- Add dishes to the future accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_cancelled_id,
        'Kangaroo Fillet',
        1,
        56.99,
        '{"option": ["Medium Rare", "Quandong glaze", "Additional finger lime"]}'
    );
    
    -- Add custom dish to future accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, custom_dish_name, custom_description, custom_price
    ) VALUES (
        customer1_cancelled_id,
        'Custom Dish Request',
        1,
        55.00,
        'Bush Tucker Tasting Platter',
        'A selection of native Australian ingredients prepared in various ways. Particularly interested in trying wattleseed and finger lime.',
        55.00
    );
    
    -- Create orders for customer 2
    
    -- 1. PENDING order with chef_sydney (FUTURE PENDING ORDER)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer2_pending_id, 
        customer2_id, 
        customer2_email, 
        customer2_phone, 
        chef_sydney_id, 
        chef_sydney_name,
        customer2_address_line, 
        customer2_city, 
        customer2_state, 
        customer2_zip,
        customer2_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date, 
        'pending', 
        'paid', 
        93.98, 
        false, 
        reference_date + interval '1 day' + interval '10 hours'
    );
    
    -- Add dishes to the pending order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_pending_id,
        'Vegemite Glazed Lamb Rack',
        1,
        64.99,
        '{"option": ["Medium rare", "Extra vegetables", "Less Vegemite flavor"]}'
    ),
    (
        customer2_pending_id,
        'Pavlova with Native Fruits',
        1,
        28.99,
        '{"option": ["Passion fruit topping", "Extra cream", "Extra berries"]}'
    );
    
    -- 2. ACCEPTED order with chef_western (PAST ORDER 1)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer2_completed1_id, 
        customer2_id, 
        customer2_email, 
        customer2_phone, 
        chef_western_id, 
        chef_western_name,
        customer2_address_line, 
        customer2_city, 
        customer2_state, 
        customer2_zip,
        customer2_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '12 days', 
        'accepted', 
        'paid', 
        108.49, 
        false, 
        reference_date - interval '12 days' + interval '7 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options, dish_types
    ) VALUES (
        customer2_completed1_id,
        'Lobster Risotto',
        1,
        49.50,
        '{"option": ["Extra lobster", "Truffle shavings"]}',
        '{"types": []}'
    ),
    (
        customer2_completed1_id,
        'Coq au Vin',
        1,
        42.75,
        '{"option": ["Substitute white meat", "Extra sauce"]}',
        '{"types": []}'
    ),
    (
        customer2_completed1_id,
        'Crème Brûlée',
        1,
        24.99,
        '{"option": ["Lavender infusion", "Extra berries"]}',
        '{"types": []}'
    );
    
    -- 3. ACCEPTED order with chef_western (PAST ORDER 2)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer2_completed2_id, 
        customer2_id, 
        customer2_email, 
        customer2_phone, 
        chef_western_id, 
        chef_western_name,
        customer2_address_line, 
        customer2_city, 
        customer2_state, 
        customer2_zip,
        customer2_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '20 days', 
        'accepted', 
        'paid', 
        131.98, 
        true, 
        reference_date - interval '20 days' + interval '5 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_completed2_id,
        'Beef Wellington',
        2,
        58.99,
        '{"option": ["Medium", "Extra mushroom duxelles"]}'
    );
    
    -- 4. ACCEPTED order with chef_western (PAST ORDER 3)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer2_rejected_id, 
        customer2_id, 
        customer2_email, 
        customer2_phone, 
        chef_western_id, 
        chef_western_name,
        customer2_address_line, 
        customer2_city, 
        customer2_state, 
        customer2_zip,
        customer2_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date - interval '7 days', 
        'accepted', 
        'paid', 
        49.50, 
        false, 
        reference_date - interval '7 days' + interval '6 hours'
    );
    
    -- Add dishes to the accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_rejected_id,
        'Lobster Risotto',
        1,
        49.50,
        '{"option": ["Dairy-free option", "Caviar supplement"]}'
    );
    
    -- 5. ACCEPTED order with chef_asian (FUTURE ACCEPTED ORDER)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code, access_note,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
    ) VALUES (
        customer2_cancelled_id, 
        customer2_id, 
        customer2_email, 
        customer2_phone, 
        chef_asian_id, 
        chef_asian_name,
        customer2_address_line, 
        customer2_city, 
        customer2_state, 
        customer2_zip,
        customer2_access_note,
        'card', 
        'Visa ending in 4242',
        reference_date::date, 
        'accepted', 
        'paid', 
        62.75,
        true, 
        reference_date + interval '3 days' + interval '9 hours'
    );
    
    -- Add dish to the future accepted order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_cancelled_id,
        'Sushi Platter',
        1,
        62.75,
        '{"option": ["Sashimi addition", "Less wasabi", "Extra ginger"]}'
    );
    
    -- ADDITIONAL FUTURE ORDERS FOR CHEF MING CHEN (ASIAN CHEF)
    
    -- Future Order 1 for Chef Ming Chen
    DECLARE
        chef_ming_future1_id UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.orders (
            id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
            address_line, city, state, zip_code, access_note,
            payment_method_type, payment_details,
            order_date, order_status, payment_status, total_amount, is_asap, requested_time
        ) VALUES (
            chef_ming_future1_id, 
            customer1_id, 
            customer1_email, 
            customer1_phone, 
            chef_asian_id, 
            chef_asian_name,
            customer1_address_line, 
            customer1_city, 
            customer1_state, 
            customer1_zip,
            customer1_access_note,
            'card', 
            'Visa ending in 4242',
            reference_date::date, 
            'pending', 
            'paid', 
            145.50,
            false, 
            reference_date + interval '4 days' + interval '5 hours'
        );
        
        -- Add dishes to the order
        INSERT INTO public.order_dishes (
            order_id, dish_name, quantity, dish_price, customization_options
        ) VALUES (
            chef_ming_future1_id,
            'Peking Duck Feast',
            2,
            72.75,
            '{"option": ["Extra pancakes", "Extra hoisin sauce", "Spring onion garnish"]}'
        );
    END;
    
    -- Future Order 2 for Chef Ming Chen
    DECLARE
        chef_ming_future2_id UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.orders (
            id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
            address_line, city, state, zip_code, access_note,
            payment_method_type, payment_details,
            order_date, order_status, payment_status, total_amount, is_asap, requested_time
        ) VALUES (
            chef_ming_future2_id, 
            customer2_id, 
            customer2_email, 
            customer2_phone, 
            chef_asian_id, 
            chef_asian_name,
            customer2_address_line, 
            customer2_city, 
            customer2_state, 
            customer2_zip,
            customer2_access_note,
            'card', 
            'Visa ending in 4242',
            reference_date::date, 
            'accepted', 
            'paid', 
            89.99,
            false, 
            reference_date + interval '5 days' + interval '7 hours'
        );
        
        -- Add dishes to the order
        INSERT INTO public.order_dishes (
            order_id, dish_name, quantity, dish_price, customization_options
        ) VALUES (
            chef_ming_future2_id,
            'Dim Sum Selection',
            1,
            89.99,
            '{"option": ["Extra dumplings", "Less spicy", "Vegetarian options"]}'
        );
    END;
    
    -- Future Order 3 for Chef Ming Chen
    DECLARE
        chef_ming_future3_id UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.orders (
            id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
            address_line, city, state, zip_code, access_note,
            payment_method_type, payment_details,
            order_date, order_status, payment_status, total_amount, is_asap, requested_time
        ) VALUES (
            chef_ming_future3_id, 
            customer1_id, 
            customer1_email, 
            customer1_phone, 
            chef_asian_id, 
            chef_asian_name,
            customer1_address_line, 
            customer1_city, 
            customer1_state, 
            customer1_zip,
            customer1_access_note,
            'card', 
            'Visa ending in 4242',
            reference_date::date, 
            'accepted', 
            'paid', 
            120.25,
            false, 
            reference_date + interval '6 days' + interval '2 hours'
        );
        
        -- Add dishes to the order
        INSERT INTO public.order_dishes (
            order_id, dish_name, quantity, dish_price, customization_options
        ) VALUES 
        (
            chef_ming_future3_id,
            'Seafood Hot Pot',
            1,
            85.50,
            '{"option": ["Extra seafood", "Medium spicy", "Add udon noodles"]}'
        ),
        (
            chef_ming_future3_id,
            'Mango Sticky Rice',
            1,
            34.75,
            '{"option": ["Extra mango", "Coconut cream on side"]}'
        );
    END;
    
    -- ADDITIONAL FUTURE ORDERS FOR CHEF SYDNEY WILSON
    
    -- Future Order 1 for Chef Sydney Wilson
    DECLARE
        chef_sydney_future1_id UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.orders (
            id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
            address_line, city, state, zip_code, access_note,
            payment_method_type, payment_details,
            order_date, order_status, payment_status, total_amount, is_asap, requested_time
        ) VALUES (
            chef_sydney_future1_id, 
            customer2_id, 
            customer2_email, 
            customer2_phone, 
            chef_sydney_id, 
            chef_sydney_name,
            customer2_address_line, 
            customer2_city, 
            customer2_state, 
            customer2_zip,
            customer2_access_note,
            'card', 
            'Visa ending in 4242',
            reference_date::date, 
            'pending', 
            'paid', 
            115.50,
            false, 
            reference_date + interval '7 days' + interval '6 hours'
        );
        
        -- Add dishes to the order
        INSERT INTO public.order_dishes (
            order_id, dish_name, quantity, dish_price, customization_options
        ) VALUES 
        (
            chef_sydney_future1_id,
            'Kangaroo Fillet with Native Herbs',
            1,
            75.50,
            '{"option": ["Medium rare", "Bush tomato sauce", "Extra finger lime"]}'
        ),
        (
            chef_sydney_future1_id,
            'Wattleseed Pavlova',
            1,
            40.00,
            '{"option": ["Extra berries", "Macadamia crumble"]}'
        );
    END;
    
    -- Future Order 2 for Chef Sydney Wilson
    DECLARE
        chef_sydney_future2_id UUID := uuid_generate_v4();
    BEGIN
        INSERT INTO public.orders (
            id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
            address_line, city, state, zip_code, access_note,
            payment_method_type, payment_details,
            order_date, order_status, payment_status, total_amount, is_asap, requested_time
        ) VALUES (
            chef_sydney_future2_id, 
            customer1_id, 
            customer1_email, 
            customer1_phone, 
            chef_sydney_id, 
            chef_sydney_name,
            customer1_address_line, 
            customer1_city, 
            customer1_state, 
            customer1_zip,
            customer1_access_note,
            'card', 
            'Visa ending in 4242',
            reference_date::date, 
            'accepted', 
            'paid', 
            130.25,
            false, 
            reference_date + interval '8 days' + interval '4 hours'
        );
        
        -- Add dishes to the order
        INSERT INTO public.order_dishes (
            order_id, dish_name, quantity, dish_price, customization_options
        ) VALUES 
        (
            chef_sydney_future2_id,
            'Barramundi with Bush Tucker',
            1,
            65.25,
            '{"option": ["Davidson plum sauce", "Extra crispy skin", "Native herb salad"]}'
        ),
        (
            chef_sydney_future2_id,
            'Lemon Myrtle Cheesecake',
            1,
            35.00,
            '{"option": ["Macadamia crust", "Extra berry coulis"]}'
        ),
        (
            chef_sydney_future2_id,
            'Quandong Spritz',
            1,
            30.00,
            '{"option": ["Less sweet", "Extra quandong"]}'
        );
    END;
    
    -- Verify order distribution across chefs:
    -- Chef Western: 5 orders (2 for customer1, 3 for customer2)
    -- Chef Asian: 5 orders (3 for customer1, 2 for customer2) - added 3 future orders
    -- Chef Sydney: 5 orders (3 for customer1, 2 for customer2) - added 2 future orders
    
    RAISE NOTICE 'Successfully created 10 orders with 3 past orders, 1 future accepted order, and 1 future pending order per customer';
    RAISE NOTICE 'Reference date used: %', reference_date;
    RAISE NOTICE 'Chef Western: 5 orders';
    RAISE NOTICE 'Chef Asian: 5 orders';
    RAISE NOTICE 'Chef Sydney: 5 orders';
    
END $$; 