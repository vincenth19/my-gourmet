export type ProfileRole = 'customer' | 'chef' | 'admin';
export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'rejected';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  contact_number?: string;
  preferences?: string;
  avatar_url?: string;
  default_address?: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at?: string;
}

export interface DietaryTag {
  id: string;
  label: string;
  value?: string;
}

export interface ProfileDietaryTag {
  id: string;
  profile_id: string;
  dietary_tag_id: string;
}

export interface Address {
  id: string;
  profile_id: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  access_note?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  profile_id: string;
  method_type: string;
  card_number: string;
  expiry_date: string;
  cvv: string;
  name_on_card: string;
  created_at: string;
}

export interface Dish {
  id: string;
  chef_id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  customization_options?: {
    options: string[];
  };
  dish_types?: {
    types: string[];
  };
  created_at: string;
  updated_at?: string;
}

export interface DishDietaryTag {
  id: string;
  dish_id: string;
  dietary_tag_id: string;
}

export interface Cart {
  id: string;
  profile_id: string;
  created_at: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  dish_id?: string;
  quantity: number;
  dish_name: string;
  dish_price: number;
  custom_dish_name?: string;
  custom_description?: string;
  custom_price?: number;
  customization_options?: {
    option: string[];
  };
  dish_types?: {
    types: string[];
  };
  dietary_tags?: string[] | Record<string, string | number | boolean>;
  dish_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  profile_id?: string;
  profile_email: string;
  profile_contact_number: string;
  chef_id?: string;
  chef_name: string;
  
  // Address details
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  
  // Payment details
  payment_method_type: string;
  payment_details: string;
  
  order_date: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  is_asap: boolean;
  requested_time?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderDish {
  id: string;
  order_id: string;
  dish_name: string;
  quantity: number;
  dish_price: number;
  custom_dish_name?: string;
  custom_description?: string;
  custom_price?: number;
  customization_options?: {
    option: string[];
  };
  dish_types?: {
    types: string[];
  };
  dietary_tags?: string[] | Record<string, string | number | boolean>;
  dish_note?: string;
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Database {
  profiles: Profile;
  dietary_tags: DietaryTag;
  profile_dietary_tags: ProfileDietaryTag;
  addresses: Address;
  payment_methods: PaymentMethod;
  dishes: Dish;
  dish_dietary_tags: DishDietaryTag;
  carts: Cart;
  cart_items: CartItem;
  orders: Order;
  order_dishes: OrderDish;
  notifications: Notification;
} 