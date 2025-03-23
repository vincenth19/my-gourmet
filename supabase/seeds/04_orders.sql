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
    
    customer2_name VARCHAR;
    customer2_email VARCHAR;
    customer2_phone VARCHAR;
    customer2_address_line VARCHAR;
    customer2_city VARCHAR;
    customer2_state VARCHAR;
    customer2_zip VARCHAR;
    
    -- Chef names
    chef_western_name VARCHAR;
    chef_asian_name VARCHAR;
    chef_sydney_name VARCHAR;
    
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
    SELECT address_line, city, state, zip_code INTO customer1_address_line, customer1_city, customer1_state, customer1_zip
    FROM public.addresses WHERE id = customer1_address;
    
    SELECT address_line, city, state, zip_code INTO customer2_address_line, customer2_city, customer2_state, customer2_zip
    FROM public.addresses WHERE id = customer2_address;
    
    -- Get chef names
    SELECT display_name INTO chef_western_name FROM public.profiles WHERE id = chef_western_id;
    SELECT display_name INTO chef_asian_name FROM public.profiles WHERE id = chef_asian_id;
    SELECT display_name INTO chef_sydney_name FROM public.profiles WHERE id = chef_sydney_id;
    
    -- Create orders for customer 1
    
    -- 1. PENDING order with chef_western (including custom dish)
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE, 
        'pending', 
        'paid', 
        125.75, 
        false, 
        CURRENT_TIMESTAMP + interval '2 days'
    );
    
    -- Add a regular dish to the pending order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_pending_id,
        'Beef Wellington',
        1,
        58.99,
        '{"option": ["Medium Rare", "Black truffle supplement"]}'
    );
    
    -- Add a custom dish to the pending order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, custom_dish_name, custom_description, dish_note
    ) VALUES (
        customer1_pending_id,
        'Custom Dish Request',
        1,
        0.00,  -- Price will be set by chef later
        'Truffle Pasta Special',
        'Homemade pasta with black truffle sauce, using seasonal truffles. Prefer a creamy base and fresh parmesan.',
        'I have a mild garlic allergy, please use minimal garlic'
    );
    
    -- 2. COMPLETED order with chef_western
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '10 days', 
        'completed', 
        'paid', 
        86.50, 
        true, 
        CURRENT_TIMESTAMP - interval '10 days'
    );
    
    -- Add dishes to the completed order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options, dish_types
    ) VALUES (
        customer1_completed1_id,
        'Spaghetti Carbonara',
        2,
        36.50,
        '{"option": ["Extra pancetta", "Al dente", "Extra cheese"]}',
        '{"types": ["Pasta", "Italian", "Main Course", "Pork"]}'
    );
    
    -- Add a custom dish to the completed order (with chef-assigned price)
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, custom_dish_name, custom_description, custom_price, dish_types
    ) VALUES (
        customer1_completed1_id,
        'Custom Dish Request',
        1,
        65.00,
        'Seafood Risotto Special',
        'A creamy risotto with mixed seafood, especially scallops and prawns.',
        65.00,
        '{"types": ["Seafood", "Italian", "Rice"]}'
    );
    
    -- 3. COMPLETED order with chef_sydney
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '15 days', 
        'completed', 
        'paid', 
        97.48, 
        false, 
        CURRENT_TIMESTAMP - interval '15 days'
    );
    
    -- Add dishes to the completed order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES 
    (
        customer1_completed2_id,
        'Barramundi with Bush Tucker',
        1,
        52.50,
        '{"option": ["Davidson plum sauce", "Extra crispy skin", "Lemon wedge"]}'
    ),
    (
        customer1_completed2_id,
        'Emu Burger with Beetroot',
        1,
        38.75,
        '{"option": ["Add cheese", "Gluten-free bun"]}'
    );
    
    -- 4. REJECTED order with chef_asian
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '5 days', 
        'rejected', 
        'refunded', 
        68.00, 
        true, 
        CURRENT_TIMESTAMP - interval '5 days'
    );
    
    -- Add dishes to the rejected order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_rejected_id,
        'Peking Duck',
        1,
        68.00,
        '{"option": ["Extra pancakes", "Extra crispy skin", "Spring onion garnish"]}'
    );
    
    -- 5. CANCELLED order with chef_sydney
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time,
        cancellation_fee, original_amount
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '3 days', 
        'cancelled', 
        'paid', 
        50.00,  -- Cancellation fee
        false, 
        CURRENT_TIMESTAMP - interval '3 days',
        50.00,  -- Cancellation fee
        121.98  -- Original amount
    );
    
    -- Add dishes to the cancelled order (including a custom dish)
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer1_cancelled_id,
        'Kangaroo Fillet',
        1,
        56.99,
        '{"option": ["Medium Rare", "Quandong glaze", "Additional finger lime"]}'
    );
    
    -- Add custom dish to cancelled order
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
    
    -- 1. PENDING order with chef_sydney
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE, 
        'pending', 
        'paid', 
        93.98, 
        false, 
        CURRENT_TIMESTAMP + interval '1 day'
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
    
    -- 2. COMPLETED order with chef_western
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '12 days', 
        'completed', 
        'paid', 
        108.49, 
        false, 
        CURRENT_TIMESTAMP - interval '12 days'
    );
    
    -- Add dishes to the completed order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options, dish_types
    ) VALUES (
        customer2_completed1_id,
        'Lobster Risotto',
        1,
        49.50,
        '{"option": ["Extra lobster", "Truffle shavings"]}',
        '{"types": ["Seafood", "Italian", "Rice", "Premium"]}'
    ),
    (
        customer2_completed1_id,
        'Coq au Vin',
        1,
        42.75,
        '{"option": ["Substitute white meat", "Extra sauce"]}',
        '{"types": ["Chicken", "French", "Main Course", "Classic"]}'
    ),
    (
        customer2_completed1_id,
        'Crème Brûlée',
        1,
        24.99,
        '{"option": ["Lavender infusion", "Extra berries"]}',
        '{"types": ["Dessert", "French", "Custard", "Elegant"]}'
    );
    
    -- 3. COMPLETED order with chef_western
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '20 days', 
        'completed', 
        'paid', 
        131.98, 
        true, 
        CURRENT_TIMESTAMP - interval '20 days'
    );
    
    -- Add dishes to the completed order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_completed2_id,
        'Beef Wellington',
        2,
        58.99,
        '{"option": ["Medium", "Extra mushroom duxelles"]}'
    );
    
    -- 4. REJECTED order with chef_western
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '7 days', 
        'rejected', 
        'refunded', 
        49.50, 
        false, 
        CURRENT_TIMESTAMP - interval '7 days'
    );
    
    -- Add dishes to the rejected order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_rejected_id,
        'Lobster Risotto',
        1,
        49.50,
        '{"option": ["Dairy-free option", "Caviar supplement"]}'
    );
    
    -- 5. CANCELLED order with chef_asian
    INSERT INTO public.orders (
        id, profile_id, profile_email, profile_contact_number, chef_id, chef_name,
        address_line, city, state, zip_code,
        payment_method_type, payment_details,
        order_date, order_status, payment_status, total_amount, is_asap, requested_time,
        cancellation_fee, original_amount
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
        'card', 
        'Visa ending in 4242',
        CURRENT_DATE - interval '4 days', 
        'cancelled', 
        'paid', 
        50.00,  -- Cancellation fee
        true, 
        CURRENT_TIMESTAMP - interval '4 days',
        50.00,  -- Cancellation fee
        62.75  -- Original amount
    );
    
    -- Add dish to the cancelled order
    INSERT INTO public.order_dishes (
        order_id, dish_name, quantity, dish_price, customization_options
    ) VALUES (
        customer2_cancelled_id,
        'Sushi Platter',
        1,
        62.75,
        '{"option": ["Sashimi addition", "Less wasabi", "Extra ginger"]}'
    );
    
    -- Verify order distribution across chefs:
    -- Chef Western: 5 orders (2 for customer1, 3 for customer2)
    -- Chef Asian: 2 orders (1 for customer1, 1 for customer2)
    -- Chef Sydney: 3 orders (2 for customer1, 1 for customer2)
    
    -- Verify custom dishes:
    -- Customer1 has custom dishes in pending, completed and cancelled orders
    -- As required in the specifications
    
    RAISE NOTICE 'Successfully created 10 orders (5 for each customer) distributed across chefs';
    RAISE NOTICE 'Chef Western: 5 orders';
    RAISE NOTICE 'Chef Asian: 2 orders';
    RAISE NOTICE 'Chef Sydney: 3 orders';
    
END $$; 