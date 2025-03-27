-- Create an RPC function to get the most ordered dishes with chef information
CREATE OR REPLACE FUNCTION public.get_most_ordered_dishes(limit_count INTEGER DEFAULT 8)
RETURNS TABLE (
  dish_name TEXT,
  chef_name TEXT,
  chef_id UUID,
  image_url TEXT,
  price DECIMAL,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- Select dishes by frequency, excluding custom dishes and using the direct dish_id reference
  WITH dish_counts AS (
    SELECT 
      od.dish_id,
      od.dish_name,
      COUNT(*) AS order_count,
      MAX(od.dish_price) AS price,
      MAX(od.chef_id) AS most_recent_chef_id -- Use the chef_id from order_dishes
    FROM 
      public.order_dishes od
    WHERE 
      od.dish_name != 'Custom Dish Request'
      AND od.dish_id IS NOT NULL -- Only include orders with a valid dish_id
    GROUP BY 
      od.dish_id, od.dish_name
    ORDER BY 
      order_count DESC
    LIMIT limit_count * 2 -- Get more dishes to account for filtering
  ),
  dish_details AS (
    SELECT 
      dc.dish_name,
      dc.order_count,
      dc.price,
      COALESCE(
        -- First try to use the direct chef_id reference
        dc.most_recent_chef_id,
        -- Fall back to fetching from the orders table if necessary
        (
          SELECT o.chef_id 
          FROM public.orders o
          INNER JOIN public.order_dishes od ON od.order_id = o.id
          WHERE od.dish_id = dc.dish_id
          ORDER BY o.created_at DESC
          LIMIT 1
        )
      ) AS chef_id,
      -- Get chef name from profiles table directly
      (
        SELECT p.display_name
        FROM public.profiles p
        WHERE p.id = COALESCE(
          dc.most_recent_chef_id,
          (
            SELECT o.chef_id 
            FROM public.orders o
            INNER JOIN public.order_dishes od ON od.order_id = o.id
            WHERE od.dish_id = dc.dish_id
            ORDER BY o.created_at DESC
            LIMIT 1
          )
        )
        LIMIT 1
      ) AS chef_name,
      -- Get image URL directly from dishes table using dish_id
      (
        SELECT d.image_url 
        FROM public.dishes d
        WHERE d.id = dc.dish_id
        LIMIT 1
      ) AS image_url
    FROM 
      dish_counts dc
    -- Only include dishes that still exist in the dishes table and have a valid chef
    WHERE EXISTS (
      SELECT 1 
      FROM public.dishes d 
      WHERE d.id = dc.dish_id
    )
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = COALESCE(
        dc.most_recent_chef_id,
        (
          SELECT o.chef_id 
          FROM public.orders o
          INNER JOIN public.order_dishes od ON od.order_id = o.id
          WHERE od.dish_id = dc.dish_id
          ORDER BY o.created_at DESC
          LIMIT 1
        )
      )
      AND p.role = 'chef'
    )
  )
  
  SELECT 
    dd.dish_name,
    dd.chef_name,
    dd.chef_id,
    dd.image_url,
    dd.price,
    dd.order_count
  FROM 
    dish_details dd
  ORDER BY 
    dd.order_count DESC
  LIMIT limit_count; -- Final limit
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION public.get_most_ordered_dishes(INTEGER) IS 'Get the most ordered dishes with chef information and order counts, using direct dish_id and chef_id references and only returning dishes that still exist with valid chefs'; 