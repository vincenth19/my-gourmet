-- File: supabase/seeds/03_dish_tags.sql

-- Get some dish IDs to assign tags (you may need to adapt this to match actual IDs)
DO $$
DECLARE
    -- Western dishes
    wellington_id UUID;
    risotto_id UUID;
    carbonara_id UUID;
    creme_brulee_id UUID;
    
    -- Asian dishes
    sushi_id UUID;
    curry_id UUID;
    pho_id UUID;
    mango_rice_id UUID;
    
    -- Australian dishes
    barramundi_id UUID;
    pavlova_id UUID;
    
    -- Tag IDs
    gluten_free_id UUID := 'd1111111-d111-d111-d111-d11111111111';
    vegetarian_id UUID := 'd2222222-d222-d222-d222-d22222222222';
    vegan_id UUID := 'd3333333-d333-d333-d333-d33333333333';
    nut_free_id UUID := 'd4444444-d444-d444-d444-d44444444444';
    dairy_free_id UUID := 'd5555555-d555-d555-d555-d55555555555';
    seafood_id UUID := 'd6666666-d666-d666-d666-d66666666666';
    spicy_id UUID := 'd7777777-d777-d777-d777-d77777777777';
BEGIN
    -- Get dish IDs
    SELECT id INTO wellington_id FROM public.dishes WHERE name = 'Beef Wellington' AND chef_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
    SELECT id INTO risotto_id FROM public.dishes WHERE name = 'Lobster Risotto' AND chef_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
    SELECT id INTO carbonara_id FROM public.dishes WHERE name = 'Spaghetti Carbonara' AND chef_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
    SELECT id INTO creme_brulee_id FROM public.dishes WHERE name = 'Crème Brûlée' AND chef_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
    
    SELECT id INTO sushi_id FROM public.dishes WHERE name = 'Sushi Platter' AND chef_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;
    SELECT id INTO curry_id FROM public.dishes WHERE name = 'Thai Green Curry' AND chef_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;
    SELECT id INTO pho_id FROM public.dishes WHERE name = 'Beef Pho' AND chef_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;
    SELECT id INTO mango_rice_id FROM public.dishes WHERE name = 'Mango Sticky Rice' AND chef_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;
    
    SELECT id INTO barramundi_id FROM public.dishes WHERE name = 'Barramundi with Bush Tucker' AND chef_id = '33333333-3333-3333-3333-333333333333' LIMIT 1;
    SELECT id INTO pavlova_id FROM public.dishes WHERE name = 'Pavlova with Native Fruits' AND chef_id = '33333333-3333-3333-3333-333333333333' LIMIT 1;

    -- Insert dish-tag associations if the dish exists
    -- Seafood dishes
    IF risotto_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (risotto_id, seafood_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF sushi_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (sushi_id, seafood_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (sushi_id, gluten_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF barramundi_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (barramundi_id, seafood_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (barramundi_id, gluten_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Vegetarian/Vegan dishes
    IF creme_brulee_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (creme_brulee_id, vegetarian_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (creme_brulee_id, nut_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF mango_rice_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (mango_rice_id, vegetarian_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (mango_rice_id, vegan_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (mango_rice_id, gluten_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF pavlova_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (pavlova_id, vegetarian_id) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Spicy dishes
    IF curry_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (curry_id, spicy_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (curry_id, gluten_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF pho_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (pho_id, spicy_id) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Nut-free and dairy-free
    IF carbonara_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (carbonara_id, nut_free_id) ON CONFLICT DO NOTHING;
    END IF;
    
    IF wellington_id IS NOT NULL THEN
        INSERT INTO public.dish_dietary_tags (dish_id, dietary_tag_id) VALUES (wellington_id, nut_free_id) ON CONFLICT DO NOTHING;
    END IF;
END $$;