-- Create enum types
CREATE TYPE public.app_role AS ENUM ('customer', 'chef', 'admin');
CREATE TYPE public.order_status AS ENUM ('pending', 'accepted', 'completed', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'refunded');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  contact_number VARCHAR,
  preferences TEXT,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create dietary_tags table
CREATE TABLE public.dietary_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR NOT NULL,
  value TEXT
);

-- Create profile_dietary_tags table
CREATE TABLE public.profile_dietary_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  dietary_tag_id UUID REFERENCES public.dietary_tags(id)
);

-- Create addresses table
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_line VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  zip_code VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type VARCHAR NOT NULL,
  card_number VARCHAR NOT NULL,
  expiry_date VARCHAR NOT NULL,
  cvv VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  customization_options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create dish_dietary_tags table
CREATE TABLE public.dish_dietary_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES public.dishes(id),
  dietary_tag_id UUID REFERENCES public.dietary_tags(id)
);

-- Create carts table
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID REFERENCES public.carts(id),
  dish_id UUID REFERENCES public.dishes(id) NULL,
  quantity INTEGER DEFAULT 1,
  dish_name VARCHAR NOT NULL,
  dish_price DECIMAL(10, 2) NOT NULL,
  custom_dish_name VARCHAR NULL,
  custom_description TEXT NULL,
  custom_price DECIMAL(10, 2) NULL,
  customizations TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NULL,
  profile_email VARCHAR NOT NULL,
  profile_contact_number VARCHAR NOT NULL,
  chef_name VARCHAR NOT NULL,
  
  -- Address details at time of order
  address_line VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  zip_code VARCHAR NOT NULL,
  
  -- Payment details at time of order
  payment_method_type VARCHAR NOT NULL,
  payment_details VARCHAR NOT NULL,
  
  order_date DATE NOT NULL,
  order_status public.order_status NOT NULL,
  payment_status public.payment_status NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  is_asap BOOLEAN NOT NULL,
  requested_time TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create order_dishes table
CREATE TABLE public.order_dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id),
  dish_name VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_order DECIMAL(10, 2) NOT NULL,
  custom_dish_name VARCHAR NULL,
  custom_description TEXT NULL,
  custom_price DECIMAL(10, 2) NULL,
  customization_options JSONB,
  dietary_tags JSONB
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_dishes
BEFORE UPDATE ON public.dishes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_carts
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_cart_items
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Create auth trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    contact_number,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', 'User'),
    (COALESCE(new.raw_user_meta_data->>'role', 'customer'))::text::public.app_role,
    COALESCE(new.raw_user_meta_data->>'contact_number', ''),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id); 