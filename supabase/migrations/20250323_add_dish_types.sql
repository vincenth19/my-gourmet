-- Migration to add dish_types column to dishes, cart_items, and order_dishes tables
-- Format: {"types": [array of strings]}

-- Add dish_types column to dishes table
ALTER TABLE public.dishes 
ADD COLUMN dish_types JSONB;

-- Add dish_types column to cart_items table
ALTER TABLE public.cart_items 
ADD COLUMN dish_types JSONB;

-- Add dish_types column to order_dishes table
ALTER TABLE public.order_dishes 
ADD COLUMN dish_types JSONB;

-- Add comment for the dish_types column in dishes table
COMMENT ON COLUMN public.dishes.dish_types IS 'Types/categories of the dish in format {"types": ["type1", "type2", ...]}';

-- Add comment for the dish_types column in cart_items table
COMMENT ON COLUMN public.cart_items.dish_types IS 'Types/categories of the dish in format {"types": ["type1", "type2", ...]}';

-- Add comment for the dish_types column in order_dishes table
COMMENT ON COLUMN public.order_dishes.dish_types IS 'Types/categories of the dish in format {"types": ["type1", "type2", ...]}'; 