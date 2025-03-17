-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_dietary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_dietary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_dishes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for dietary_tags table (read-only for authenticated users)
CREATE POLICY "Authenticated users can view all dietary tags"
  ON public.dietary_tags FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for profile_dietary_tags table
CREATE POLICY "Authenticated users can view all profile dietary tags"
  ON public.profile_dietary_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own profile dietary tags"
  ON public.profile_dietary_tags FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create policies for addresses table
CREATE POLICY "Authenticated users can view addresses"
  ON public.addresses FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create policies for payment_methods table
CREATE POLICY "Authenticated users can view payment methods"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create policies for dishes table
CREATE POLICY "Authenticated users can view all dishes"
  ON public.dishes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Chefs can manage their own dishes"
  ON public.dishes FOR ALL
  TO authenticated
  USING (chef_id = auth.uid())
  WITH CHECK (chef_id = auth.uid());

-- Create policies for dish_dietary_tags table
CREATE POLICY "Authenticated users can view all dish dietary tags"
  ON public.dish_dietary_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Chefs can manage dietary tags for their dishes"
  ON public.dish_dietary_tags FOR ALL
  TO authenticated
  USING (dish_id IN (SELECT id FROM dishes WHERE chef_id = auth.uid()))
  WITH CHECK (dish_id IN (SELECT id FROM dishes WHERE chef_id = auth.uid()));

-- Create policies for carts table
CREATE POLICY "Authenticated users can view their own cart"
  ON public.carts FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can manage their own cart"
  ON public.carts FOR ALL
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Create policies for cart_items table
CREATE POLICY "Authenticated users can view their own cart items"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING (cart_id IN (SELECT id FROM public.carts WHERE profile_id = auth.uid()));

CREATE POLICY "Users can manage their own cart items"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (cart_id IN (SELECT id FROM public.carts WHERE profile_id = auth.uid()))
  WITH CHECK (cart_id IN (SELECT id FROM public.carts WHERE profile_id = auth.uid()));

-- Create policies for orders table
CREATE POLICY "Clients can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Chefs can view orders assigned to them"
  ON public.orders FOR SELECT
  TO authenticated
  USING (chef_id = auth.uid());

CREATE POLICY "Clients can insert their own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Clients can update their own orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Chefs can update orders assigned to them"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (chef_id = auth.uid());

-- Create policies for order_dishes table
CREATE POLICY "Clients can view dishes in their orders"
  ON public.order_dishes FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid()));

CREATE POLICY "Chefs can view dishes in orders assigned to them"
  ON public.order_dishes FOR SELECT
  TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE chef_id = auth.uid()));

CREATE POLICY "Clients can insert dishes to their orders"
  ON public.order_dishes FOR INSERT
  TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE profile_id = auth.uid()));

-- For a school project, we'll add a special policy for admins
-- This assumes you have a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policies for all tables
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all dietary tags"
  ON public.dietary_tags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all profile dietary tags"
  ON public.profile_dietary_tags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all dishes"
  ON public.dishes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all dish dietary tags"
  ON public.dish_dietary_tags FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all carts"
  ON public.carts FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all cart items"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage all order dishes"
  ON public.order_dishes FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin()); 