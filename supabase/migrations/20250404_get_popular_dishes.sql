-- Create an RPC function to get the most ordered dishes with chef information
CREATE OR REPLACE FUNCTION public.get_most_ordered_dishes(limit_count INTEGER DEFAULT 4)
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
  -- Select dishes by frequency, excluding custom dishes
  WITH dish_counts AS (
    SELECT 
      od.dish_name,
      COUNT(*) AS order_count,
      MAX(od.dish_price) AS price
    FROM 
      public.order_dishes od
    WHERE 
      od.dish_name != 'Custom Dish Request'
    GROUP BY 
      od.dish_name
    ORDER BY 
      order_count DESC
    LIMIT limit_count
  ),
  dish_details AS (
    SELECT 
      dc.dish_name,
      dc.order_count,
      dc.price,
      -- Get the most recent order for each dish to get chef information
      (
        SELECT o.chef_id 
        FROM public.orders o
        INNER JOIN public.order_dishes od ON od.order_id = o.id
        WHERE od.dish_name = dc.dish_name
        ORDER BY o.created_at DESC
        LIMIT 1
      ) AS chef_id,
      (
        SELECT o.chef_name 
        FROM public.orders o
        INNER JOIN public.order_dishes od ON od.order_id = o.id
        WHERE od.dish_name = dc.dish_name
        ORDER BY o.created_at DESC
        LIMIT 1
      ) AS chef_name,
      -- Get image URL from dishes table
      (
        SELECT d.image_url 
        FROM public.dishes d
        WHERE d.name = dc.dish_name
        LIMIT 1
      ) AS image_url
    FROM 
      dish_counts dc
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
    dd.order_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION public.get_most_ordered_dishes(INTEGER) IS 'Get the most ordered dishes with chef information and order counts'; 