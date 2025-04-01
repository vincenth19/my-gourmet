-- Create an RPC function to get the most ordered dishes with chef information
CREATE OR REPLACE FUNCTION public.get_most_ordered_dishes(limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
  dish_id UUID,
  dish_name TEXT,
  chef_name TEXT,
  chef_id UUID,
  image_url TEXT,
  price DECIMAL,
  order_count BIGINT
) 
SECURITY DEFINER -- Run with function owner's permissions
SET search_path = '' -- Security precaution to avoid search_path hijacking
AS $$
BEGIN
  RETURN QUERY
  -- Select dishes by frequency, excluding custom dishes and using the direct dish_id reference
  WITH dish_counts AS (
    SELECT 
      od.dish_id,
      od.dish_name::text,
      COUNT(*) AS order_count,
      MAX(od.dish_price) AS price,
      od.chef_id AS most_recent_chef_id,
      od.created_at
    FROM 
      public.order_dishes od
    JOIN
      public.orders o ON od.order_id = o.id
    WHERE 
      od.dish_name != 'Custom Dish Request'
      AND od.dish_id IS NOT NULL -- Only include orders with a valid dish_id
      AND o.order_status = 'accepted' -- Only count dishes from accepted orders
    GROUP BY 
      od.dish_id, od.dish_name, od.chef_id, od.created_at
    ORDER BY 
      order_count DESC
    LIMIT limit_count * 2 -- Get more dishes to account for filtering
  ),
  dish_details AS (
    SELECT DISTINCT ON (dc.dish_id)
      dc.dish_id,
      dc.dish_name::text,
      dc.order_count,
      dc.price,
      dc.most_recent_chef_id AS chef_id,
      -- Get chef name from profiles table directly
      (
        SELECT p.display_name::text
        FROM public.profiles p
        WHERE p.id = dc.most_recent_chef_id
        LIMIT 1
      ) AS chef_name,
      -- Get image URL directly from dishes table using dish_id
      (
        SELECT d.image_url::text 
        FROM public.dishes d
        WHERE d.id = dc.dish_id
        LIMIT 1
      ) AS image_url
    FROM 
      dish_counts dc
    ORDER BY 
      dc.dish_id,
      dc.created_at DESC
  )
  
  SELECT 
    dd.dish_id,
    dd.dish_name,
    dd.chef_name,
    dd.chef_id,
    dd.image_url,
    dd.price,
    dd.order_count
  FROM 
    dish_details dd
  WHERE EXISTS (
    SELECT 1 
    FROM public.dishes d 
    WHERE d.id = dd.dish_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = dd.chef_id
    AND p.role = 'chef'
  )
  ORDER BY 
    dd.order_count DESC
  LIMIT limit_count; -- Final limit
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION public.get_most_ordered_dishes(INTEGER) IS 'Get the most ordered dishes with chef information and order counts from accepted orders, using direct dish_id and chef_id references and only returning dishes that still exist with valid chefs'; 