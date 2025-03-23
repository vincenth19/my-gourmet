-- File: supabase/seeds/02_dishes.sql

-- Western Cuisine Chef's Dishes
-- Chef Gordon (French & Italian)
INSERT INTO public.dishes (chef_id, name, price, description, customization_options, dish_types, image_url)
VALUES
('11111111-1111-1111-1111-111111111111', 'Beef Wellington', 58.99, 
 'A culinary masterpiece featuring 28-day dry-aged Wagyu beef tenderloin, enveloped in layers of wild mushroom duxelles with black truffle, Parma prosciutto, and handcrafted all-butter puff pastry. The beef is seared to seal in juices, then precisely roasted to your preference. Accompanied by a velvety red wine reduction made with Château Margaux, roasted heirloom baby vegetables, and pommes purée with Normandy butter.',
 '{"options": ["Extra mushroom duxelles", "Black truffle supplement"]}',
 '{"types": ["Beef", "Main Course", "British", "Premium"]}',
 'https://images.unsplash.com/photo-1546964053-d018e345e490?q=80&w=2940'),

('11111111-1111-1111-1111-111111111111', 'Lobster Risotto', 49.50, 
 'Acquerello aged carnaroli rice slowly cooked to perfection with house-made seafood fumét and Krug Grande Cuvée champagne. Enriched with mascarpone and 24-month aged Parmigiano-Reggiano, then crowned with a butter-poached Maine lobster tail and claw meat. Finished with shaved bottarga, Sturia caviar, and micro herbs from our rooftop garden. Each grain remains distinct while achieving the quintessential "wave" texture of authentic Italian risotto.',
 '{"options": ["Extra lobster", "Truffle shavings", "Caviar supplement", "Dairy-free option", "Extra creamy"]}',
 '{"types": ["Seafood", "Italian", "Rice", "Premium"]}',
 'https://www.denverlifemagazine.com/wp-content/uploads/2019/10/dish.jpg'),

('11111111-1111-1111-1111-111111111111', 'Coq au Vin', 42.75, 
 'A refined interpretation of the French classic featuring free-range Bresse chicken marinated for 48 hours in 2015 Domaine de la Romanée-Conti pinot noir. Slowly braised with heritage carrots, pearl onions from our garden, forest mushrooms, and Alsatian bacon lardons. The sauce is intensified through careful reduction and finished with a touch of cognac. Served with silky potato purée incorporating French cultured butter and a delicate garnish of thyme blossoms.',
 '{"options": ["Substitute white meat", "Extra sauce", "No mushrooms", "Extra bacon lardons", "Garlic bread side"]}',
 '{"types": ["Chicken", "French", "Main Course", "Classic"]}',
 'https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=800'),

('11111111-1111-1111-1111-111111111111', 'Spaghetti Carbonara', 36.50, 
 'Artisanal bronze-extruded spaghetti from a fifth-generation producer in Abruzzo, cooked precisely al dente. Tossed in a silky emulsion of farm-fresh heirloom egg yolks, aged Pecorino Romano DOP, and Parmigiano-Reggiano aged 36 months. Enhanced with guanciale cured in-house for 12 months and finished with freshly cracked Tellicherry peppercorns. Served with warm handcrafted rosemary focaccia and our estate-pressed olive oil for dipping.',
 '{"options": ["Extra pancetta", "Extra cheese", "Spicy pepper flakes", "No black pepper"]}',
 '{"types": ["Pasta", "Italian", "Main Course", "Pork"]}',
 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=800'),

('11111111-1111-1111-1111-111111111111', 'Crème Brûlée', 24.99, 
 'A study in delicate contrasts: silky Tahitian vanilla bean custard infused with Madagascar vanilla pods and set to perfect consistency using only the freshest organic cream and farm eggs from our selected producer. The custard is topped with a precisely caramelized crust of raw Demerara sugar, torched tableside to order. Garnished with gold leaf, seasonal berries macerated in Grand Marnier, and edible flowers from our greenhouse.',
 '{"options": ["Lavender infusion", "Chocolate variation", "Extra berries", "Cointreau substitution", "Thicker sugar crust"]}',
 '{"types": ["Dessert", "French", "Custard", "Elegant"]}',
 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?q=80&w=800');

-- Asian Cuisine Chef's Dishes
-- Chef Ming (Asian)
INSERT INTO public.dishes (chef_id, name, price, description, customization_options, dish_types, image_url)
VALUES
('22222222-2222-2222-2222-222222222222', 'Peking Duck', 68.00, 
 'Imperial Peking duck prepared through our meticulous three-day process. The birds are sourced from a small heritage farm, then air-dried, repeatedly basted with a proprietary blend of maltose and five-spice, and roasted in our custom-built applewood-fired oven. The skin achieves perfect lacquer-like crispness while the meat remains succulent. Served in three courses: first the crispy skin with house-made paper-thin pancakes, then the tender breast meat with hoisin crafted from organic fermented soybeans, and finally a rich consommé made from the bones.',
 '{"options": ["Extra pancakes", "Duck soup from bones", "Extra crispy skin", "Less five-spice", "Extra hoisin sauce", "Spring onion garnish"]}',
 '{"types": ["Duck", "Chinese", "Main Course", "Signature"]}',
 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?q=80&w=800'),

('22222222-2222-2222-2222-222222222222', 'Sushi Platter', 62.75, 
 'A curated selection of the day`s finest fish, personally selected each morning from specialty suppliers with direct relationships to fishermen in Hokkaido and Kyushu. Each piece is precisely cut and paired with freshly harvested wasabi root from Shizuoka, and house-fermented soy sauce aged in cedar. The nigiri features perfectly seasoned rice with red vinegar made to our specifications, while the specialty rolls incorporate rare ingredients such as fresh uni, A5 Wagyu, and 24K gold flake. Each bite represents the perfect balance of texture, temperature, and flavor.',
 '{"options": ["Sashimi addition", "Extra wasabi", "Less wasabi", "Extra soy sauce", "Extra ginger"]}',
 '{"types": ["Seafood", "Japanese", "Raw", "Premium"]}',
 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800'),

('22222222-2222-2222-2222-222222222222', 'Thai Green Curry', 44.50, 
 'An aromatic masterpiece beginning with curry paste hand-pounded in a granite mortar using fresh lemongrass, galangal, makrut lime, and bird`s eye chilies sourced directly from Thailand. Simmered with first-pressed coconut cream, rare Thai eggplant varieties, bamboo shoots harvested at peak season, and holy basil from our greenhouse. Your choice of free-range organic chicken, grass-fed beef tenderloin, or house-made tofu. The harmonious balance of heat, herbaceous notes, and subtle sweetness showcases the authentic complexity of royal Thai cuisine.',
 '{"options": ["Extra vegetables", "No eggplant", "Extra rice"]}',
 '{"types": ["Thai", "Curry", "Spicy", "Customizable"]}',
 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800'),

('22222222-2222-2222-2222-222222222222', 'Beef Pho', 38.99, 
 'A symphony of flavor built from a 48-hour broth of grass-fed beef bones, charred onions, and rare spices including star anise, cardamom, and cinnamon from a single Vietnamese estate. Hand-rolled rice noodles with the perfect chew are topped with paper-thin slices of prime Wagyu beef that cook gently in the aromatic broth as it`s served. Accompanied by a bespoke selection of fresh herbs including Thai basil, sawtooth coriander, and Vietnamese mint, alongside housemate chili sauce and special hoisin crafted from organic ingredients.',
 '{"options": ["Extra beef", "Extra herbs", "Extra noodles", "No onions", "Extra chili", "Less spice", "Extra broth"]}',
 '{"types": ["Beef", "Vietnamese", "Soup", "Noodles"]}',
 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800'),

('22222222-2222-2222-2222-222222222222', 'Mango Sticky Rice', 22.50, 
 'Prized Nam Dok Mai mangoes imported at perfect ripeness from select Thai orchards, paired with heirloom glutinous rice gently cooked in premium coconut milk infused with pandanus leaf. The warm rice contrasts beautifully with the cool, velvety mango. Finished with a drizzle of coconut cream reduction, a light dusting of coconut-palm sugar, and a delicate sprinkling of toasted mung beans for textural contrast. A traditional Thai dessert elevated to sublime perfection.',
 '{"options": ["Extra mango", "Extra coconut cream", "Less sweet", "No mung beans", "Sesame seed topping"]}',
 '{"types": ["Dessert", "Thai", "Fruit", "Rice"]}',
 'https://images.unsplash.com/photo-1711161988375-da7eff032e45?q=80&w=2940');

-- Australian Fusion Chef's Dishes
-- Chef Sydney (Australian Fusion)
INSERT INTO public.dishes (chef_id, name, price, description, customization_options, dish_types, image_url)
VALUES
('33333333-3333-3333-3333-333333333333', 'Kangaroo Fillet', 56.99, 
 'Sustainably harvested, lean kangaroo loin sourced from the pristine rangelands of Central Australia. The meat is dry-aged for 21 days to intensify flavor, then marinated with native mountain pepper berries, lemon myrtle, and Tasmanian leatherwood honey. Precisely sous-vide for optimal tenderness before being quickly seared over ironbark coals. Served with a reduction incorporating Davidson plum and aged shiraz, alongside heirloom finger limes providing bursts of citrus caviar, and roasted purple sweet potato from the Northern Territory.',
 '{"options": ["Quandong glaze", "Extra sweet potato", "Additional finger lime", "Less pepper berry"]}',
 '{"types": ["Kangaroo", "Australian", "Game Meat", "Premium"]}',
 'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?q=80&w=800'),

('33333333-3333-3333-3333-333333333333', 'Barramundi with Bush Tucker', 52.50, 
 'Line-caught wild barramundi from the pristine waters of Arnhem Land, prepared with a delicate crust of ground lemon myrtle, wattleseed, and macadamia. Pan-seared to achieve crisp skin while maintaining moist, flaky flesh. Served on a bed of warrigal greens harvested by indigenous communities and lightly wilted with macadamia oil and desert lime. Accompanied by a bush tomato beurre blanc and garnished with saltbush crisps, sea blite, and hand-foraged coastal succulents that provide a natural salinity.',
 '{"options": ["Davidson plum sauce", "Extra crispy skin", "No macadamia (nut allergy)", "Extra greens", "Lemon wedge"]}',
 '{"types": ["Seafood", "Australian", "Fish", "Indigenous"]}',
 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800'),

('33333333-3333-3333-3333-333333333333', 'Vegemite Glazed Lamb Rack', 64.99, 
 'Premium grass-fed Tasmanian lamb rack with optimal marbling, coated with a sophisticated glaze incorporating Australia`s iconic Vegemite, leatherwood honey, and native thyme. The racks are first sous-vide with indigenous herbs then finished in our wood-fired oven for perfect caramelization. Each cutlet is precisely cooked to maintain juicy tenderness and served with triple-cooked rosemary-infused potatoes and a native saltbush jus. The dish is completed with charred baby vegetables from local organic farms and a sprinkle of hand-harvested Murray River pink salt.',
 '{"options": ["Extra cutlets", "Wattleseed jus", "Extra vegetables", "Less Vegemite flavor"]}',
 '{"types": ["Lamb", "Australian", "Main Course", "Fusion"]}',
 'https://img.delicious.com.au/vHIx_qQ1/del/2017/07/miso-lamb-cutlets-49822-2.jpg'),

('33333333-3333-3333-3333-333333333333', 'Emu Burger with Beetroot', 38.75, 
 'Lean, protein-rich emu patty from birds raised on a specialized farm in South Australia. The meat is ground to order and seasoned with native mountain pepper, wattleseed, and smoked salt. Served on a house-baked damper roll made with ancient grain flour and bush tomato. Topped with a free-range egg from heritage-breed hens, beetroot pickled with Davidson plum, caramelized onions slow-cooked for six hours, and our signature bush tomato relish incorporating native muntries. Accompanied by triple-cooked sweet potato wedges tossed with bush herb salt.',
 '{"options": ["Add cheese", "Add bacon", "No egg", "No beetroot", "Extra relish", "Extra sweet potato wedges"]}',
 '{"types": ["Burger", "Australian", "Emu", "Casual"]}',
 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800'),

('33333333-3333-3333-3333-333333333333', 'Pavlova with Native Fruits', 28.99, 
 'A contemporary interpretation of Australia`s iconic dessert featuring a hand-whisked meringue with free-range eggs and vanilla bean, baked to achieve the perfect contrast between crisp exterior and marshmallow-soft center. Topped with Chantilly cream infused with lemon myrtle and adorned with a vibrant array of indigenous fruits: finger limes providing citrus pearls, tart Davidson plums, sweet muntries (native cranberries), and rare quandongs. Finished with a dusting of freeze-dried desert lime and a drizzle of Tasmanian leatherwood honey for complex sweetness.',
 '{"options": ["Passion fruit topping", "Lemon myrtle ice cream", "Extra cream", "Extra honey", "Extra berries", "Chocolate shavings"]}',
 '{"types": ["Dessert", "Australian", "Meringue", "Fruit"]}',
 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?q=80&w=800');

-- Set up dietary tags for some dishes
INSERT INTO public.dietary_tags (id, label, value)
VALUES
('d1111111-d111-d111-d111-d11111111111', 'Gluten Free', 'gluten-free'),
('d2222222-d222-d222-d222-d22222222222', 'Vegetarian', 'vegetarian'),
('d3333333-d333-d333-d333-d33333333333', 'Vegan', 'vegan'),
('d4444444-d444-d444-d444-d44444444444', 'Nut Free', 'nut-free'),
('d5555555-d555-d555-d555-d55555555555', 'Dairy Free', 'dairy-free'),
('d6666666-d666-d666-d666-d66666666666', 'Seafood', 'seafood'),
('d7777777-d777-d777-d777-d77777777777', 'Spicy', 'spicy')
ON CONFLICT DO NOTHING;