-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add comment for the notifications table
COMMENT ON TABLE public.notifications IS 'Stores notifications for users about order updates and other events';

-- Add trigger for updated_at timestamp
CREATE TRIGGER set_timestamp_notifications
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to handle order events (new orders and status changes)
CREATE OR REPLACE FUNCTION public.handle_order_events()
RETURNS TRIGGER AS $$
DECLARE
  short_id TEXT;
BEGIN
  -- Extract first block of UUID (before first hyphen)
  short_id := SPLIT_PART(NEW.id::TEXT, '-', 1);

  -- For new orders (INSERT)
  IF TG_OP = 'INSERT' THEN
    -- Create notification for the customer
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.profile_id,
      'Order #' || short_id || ' Placed Successfully',
      'Your order has been placed with ' || NEW.chef_name,
      '/order-confirmation/' || NEW.id
    );

    -- No chef notification here, we'll handle it in the order_dishes trigger
  
  -- For order status changes (UPDATE)
  ELSIF TG_OP = 'UPDATE' AND OLD.order_status != NEW.order_status THEN
    -- Create notification for the customer
    INSERT INTO public.notifications (user_id, title, message, link)
    VALUES (
      NEW.profile_id,
      CASE 
        WHEN NEW.order_status = 'accepted' THEN 'Order #' || short_id || ' Accepted'
        WHEN NEW.order_status = 'completed' THEN 'Order #' || short_id || ' Completed'
        WHEN NEW.order_status = 'rejected' THEN 'Order #' || short_id || ' Rejected'
        WHEN NEW.order_status = 'cancelled' THEN 'Order #' || short_id || ' Cancelled'
      END,
      CASE 
        WHEN NEW.order_status = 'accepted' THEN 'Your order has been accepted by ' || NEW.chef_name
        WHEN NEW.order_status = 'completed' THEN 'Your order has been completed by ' || NEW.chef_name
        WHEN NEW.order_status = 'rejected' THEN 'Your order has been rejected by ' || NEW.chef_name
        WHEN NEW.order_status = 'cancelled' THEN 'Your order has been cancelled'
      END,
      '/order-confirmation/' || NEW.id
    );

    -- Create notification for the chef for status changes
    IF NEW.chef_id IS NOT NULL THEN
      -- Different notifications based on status
      IF NEW.order_status = 'accepted' THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.chef_id,
          'Order #' || short_id || ' Confirmed',
          'You have confirmed an order from ' || NEW.profile_email,
          '/chef/order/' || NEW.id
        );
      ELSIF NEW.order_status = 'cancelled' THEN
        INSERT INTO public.notifications (user_id, title, message, link)
        VALUES (
          NEW.chef_id,
          'Order #' || short_id || ' Cancelled',
          'Order has been cancelled by the customer',
          '/chef/order/' || NEW.id
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '';

-- Create function to check for custom dishes and send notifications to chef or admin
CREATE OR REPLACE FUNCTION public.handle_order_dishes_insert()
RETURNS TRIGGER AS $$
DECLARE
  short_id TEXT;
  chef_id_val UUID;
  profile_email_val TEXT;
  order_id_val UUID;
  admin_id UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd'; -- Admin user ID
  has_custom_dish BOOLEAN := FALSE;
BEGIN
  -- Get order details
  SELECT o.id, o.chef_id, o.profile_email INTO order_id_val, chef_id_val, profile_email_val
  FROM public.orders o
  WHERE o.id = NEW.order_id;
  
  -- Check if this order has any custom dishes
  SELECT EXISTS (
    SELECT 1 FROM public.order_dishes
    WHERE order_id = NEW.order_id
    AND custom_dish_name IS NOT NULL
  ) INTO has_custom_dish;
  
  -- Only proceed if we haven't sent a notification for this order yet
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE link LIKE '%' || NEW.order_id || '%'
    AND (user_id = chef_id_val OR user_id = admin_id)
    AND title LIKE 'New Order%'
  ) THEN
    -- Extract first block of UUID (before first hyphen)
    short_id := SPLIT_PART(order_id_val::TEXT, '-', 1);
    
    -- Send notification to admin or chef based on custom dish presence
    IF has_custom_dish THEN
      -- Send to admin for orders with custom dishes
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        admin_id,
        'New Order #' || short_id || ' with Custom Dish',
        'A new order with custom dish request has been received from ' || profile_email_val,
        '/admin/order/' || order_id_val
      );
    ELSE
      -- Send to chef for regular orders
      INSERT INTO public.notifications (user_id, title, message, link)
      VALUES (
        chef_id_val,
        'New Order #' || short_id || ' Received',
        'You have received a new order from ' || profile_email_val,
        '/chef/order/' || order_id_val
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = '';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS order_status_change_trigger ON public.orders;
DROP TRIGGER IF EXISTS order_dishes_insert_trigger ON public.order_dishes;

-- Create triggers for both INSERT and UPDATE events
CREATE TRIGGER order_insert_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_events();

CREATE TRIGGER order_update_trigger
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_events();

-- Create trigger for order_dishes insertion
CREATE TRIGGER order_dishes_insert_trigger
AFTER INSERT ON public.order_dishes
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_dishes_insert();

-- Add RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow chefs to view notifications about their orders
CREATE POLICY "Chefs can view notifications about their orders"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.chef_id = auth.uid()
      AND o.id::text = SUBSTRING(link FROM '/chef/order/([^/]+)')
    )
  ); 