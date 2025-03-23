-- Migration for order cancellation functionality
-- The core schema changes (cancellation_fee, original_amount columns, and cancelled status)
-- are already included in the initial schema.

-- Create function to handle order cancellation with appropriate fee calculations
CREATE OR REPLACE FUNCTION public.cancel_order(order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_record public.orders;
  cancellation_fee DECIMAL(10, 2) := 0;
BEGIN
  -- Get the order record
  SELECT * INTO order_record FROM public.orders WHERE id = order_id;
  
  -- Check if order exists
  IF order_record IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Only allow cancellation for pending or accepted orders
  IF order_record.order_status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'Only pending or accepted orders can be cancelled';
  END IF;
  
  -- Calculate cancellation fee based on status (50.00 for accepted, 0 for pending)
  IF order_record.order_status = 'accepted' THEN
    cancellation_fee := 50.00;
  END IF;
  
  -- Update the order
  UPDATE public.orders
  SET 
    order_status = 'cancelled',
    cancellation_fee = cancellation_fee,
    original_amount = CASE WHEN cancellation_fee > 0 THEN total_amount ELSE NULL END,
    total_amount = CASE WHEN cancellation_fee > 0 THEN cancellation_fee ELSE total_amount END,
    updated_at = NOW()
  WHERE id = order_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$; 