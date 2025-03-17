# MyGourmet Database Documentation

This document provides comprehensive documentation for the My Gourmet application's database schema implemented with Supabase.

## Database Schema Overview

The My Gourmet platform uses a relational database schema designed to support a food ordering platform connecting clients with chefs.

### Core Entities

#### Profiles
The central entity representing users of the platform with different roles:
- **Client**: Users who order food
- **Chef**: Users who prepare and sell food
- **Admin**: Users who manage the platform

#### Dishes
Food items created by chefs that clients can order.

#### Orders
Transactions between clients and chefs for food delivery.

## Table Descriptions

### `profiles`
Stores user information with role-based access.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| display_name | VARCHAR | User's display name |
| email | VARCHAR | User's email (unique) |
| contact_number | VARCHAR | User's contact number |
| preferences | TEXT | User preferences (JSON or text format) |
| role | app_role | User role: 'customer', 'chef', or 'admin' |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

**Note**: Supports hard delete with anonymization of completed orders.

### `dietary_tags`
Stores dietary preferences and restrictions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| label | VARCHAR | Display label for the tag |
| value | TEXT | Additional information about the tag |

### `profile_dietary_tags`
Junction table linking profiles to their dietary preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | Reference to profiles.id (CASCADE DELETE) |
| dietary_tag_id | UUID | Reference to dietary_tags.id |

### `addresses`
Stores user addresses for delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | Reference to profiles.id (CASCADE DELETE) |
| address_line | VARCHAR | Street address |
| city | VARCHAR | City |
| state | VARCHAR | State/province |
| zip_code | VARCHAR | Postal/zip code |
| created_at | TIMESTAMP | Record creation timestamp |

### `payment_methods`
Stores user payment methods.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | Reference to profiles.id (CASCADE DELETE) |
| method_type | VARCHAR | Type of payment method |
| details | VARCHAR | Payment details (encrypted/tokenized) |
| created_at | TIMESTAMP | Record creation timestamp |

### `dishes`
Stores food items created by chefs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| chef_id | UUID | Reference to profiles.id (CASCADE DELETE) |
| name | VARCHAR | Dish name |
| price | DECIMAL(10,2) | Dish price |
| description | TEXT | Dish description |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

### `dish_dietary_tags`
Junction table linking dishes to dietary tags.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| dish_id | UUID | Reference to dishes.id |
| dietary_tag_id | UUID | Reference to dietary_tags.id |

### `carts`
Stores user shopping carts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | Reference to profiles.id (CASCADE DELETE) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

### `cart_items`
Stores items in user shopping carts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cart_id | UUID | Reference to carts.id |
| dish_id | UUID | Reference to dishes.id (nullable) |
| quantity | INTEGER | Quantity of the item |
| dish_name | VARCHAR | Copy of dish name at time of adding to cart |
| dish_price | DECIMAL(10,2) | Copy of dish price at time of adding to cart |
| custom_dish_name | VARCHAR | Name for custom dish (nullable) |
| custom_description | TEXT | Description for custom dish (nullable) |
| custom_price | DECIMAL(10,2) | Price for custom dish (nullable) |
| customizations | TEXT | Customization details (nullable) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

### `orders`
Stores user orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| profile_id | UUID | Reference to profiles.id (CASCADE DELETE, nullable) |
| profile_email | VARCHAR | Copy of email at time of order |
| profile_contact_number | VARCHAR | Copy of contact at time of order |
| chef_id | UUID | Reference to profiles.id (CASCADE DELETE, nullable) |
| chef_name | VARCHAR | Copy of chef name at time of order |
| address_line | VARCHAR | Copy of address at time of order |
| city | VARCHAR | Copy of city at time of order |
| state | VARCHAR | Copy of state at time of order |
| zip_code | VARCHAR | Copy of zip code at time of order |
| payment_method_type | VARCHAR | Copy of payment method type at time of order |
| payment_details | VARCHAR | Copy of payment details at time of order |
| order_date | DATE | Date of the order |
| order_status | order_status | Status: 'pending', 'accepted', 'completed', 'rejected' |
| payment_status | payment_status | Status: 'unpaid', 'paid', 'refunded' |
| total_amount | DECIMAL(10,2) | Total order amount |
| is_asap | BOOLEAN | Whether delivery is ASAP |
| requested_time | TIMESTAMP | Requested delivery time (nullable) |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record update timestamp |

### `order_dishes`
Stores dishes in orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Reference to orders.id |
| dish_id | UUID | Reference to dishes.id (nullable) |
| dish_name | VARCHAR | Copy of dish name at time of order |
| quantity | INTEGER | Quantity of the dish |
| price_at_order | DECIMAL(10,2) | Price at time of order |
| custom_dish_name | VARCHAR | Name for custom dish (nullable) |
| custom_description | TEXT | Description for custom dish (nullable) |
| custom_price | DECIMAL(10,2) | Price for custom dish (nullable) |
| customizations | TEXT | Customization details |
| dietary_tags | JSONB | JSON array of relevant tags at order time |

## Entity Relationships

### One-to-Many Relationships
- A profile can have many addresses
- A profile can have many payment methods
- A chef (profile) can have many dishes
- A profile can have one cart
- A cart can have many cart items
- A profile can place many orders
- An order can have many order dishes

### Many-to-Many Relationships
- Profiles and dietary tags (via profile_dietary_tags)
- Dishes and dietary tags (via dish_dietary_tags)

## Row Level Security (RLS)

The database implements Row Level Security to ensure data privacy and access control. All tables have RLS enabled and are restricted to authenticated users only.

### Role-Based Access Control

Access is controlled based on user roles:

1. **All Authenticated Users**:
   - Can view all profiles
   - Can view all dishes and dietary tags
   - Can only view and manage their own data (addresses, payment methods, carts, orders)

2. **Client Role**:
   - Can view and update their own profile
   - Can view all dishes
   - Can manage their own cart and place orders
   - Can view and update their own orders

3. **Chef Role**:
   - Can view and update their own profile
   - Can create and manage their own dishes
   - Can view and update orders assigned to them

4. **Admin Role**:
   - Has full access to all tables
   - Can manage all data in the system

### Security Implementation

The RLS policies are implemented in `migrations/20240317_rls_policies.sql` and include:

- Table-level policies that restrict access to authenticated users only
- Row-level policies that restrict access based on user ID and role
- A custom `is_admin()` function that checks if the current user has admin privileges

### Example Policy

```sql
-- Example: Users can only view their own addresses
CREATE POLICY "Authenticated users can view addresses"
  ON addresses FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());
```

This ensures that users can only access their own address records, enhancing privacy and security. Since we're using UUIDs for all IDs, the `auth.uid()` function can be directly compared with the `profile_id` field without any type conversion.

## Data Integrity Features

### Automatic Timestamps
- `created_at` is automatically set on record creation
- `updated_at` is automatically updated on record modification via triggers

### Cascade Deletes
- When a profile is deleted, all related records (addresses, payment methods, dishes, carts, orders) are automatically deleted
- This ensures referential integrity while supporting the requirement for hard deletion with anonymization

### Data Redundancy for Historical Accuracy
- Order-related tables store copies of relevant data at the time of order
- This ensures historical accuracy even if the original data changes or is deleted

## Indexes

The following indexes are created for performance optimization:

- `idx_profiles_email` on profiles(email)
- `idx_dishes_chef_id` on dishes(chef_id)
- `idx_cart_items_cart_id` on cart_items(cart_id)
- `idx_orders_profile_id` on orders(profile_id)
- `idx_orders_chef_id` on orders(chef_id)
- `idx_order_dishes_order_id` on order_dishes(order_id)

## How to Apply the Schema

### Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Apply the migrations:
   ```bash
   supabase db push
   ```

### Using the Reset Script

For local development, you can use the provided reset script to reset the database and apply all migrations in the correct order:

```bash
./supabase/scripts/reset-db.sh
```

This script will:
1. Reset the Supabase database
2. Apply the initial schema (`20240316_initial_schema.sql`) with UUID-based IDs
3. Apply the RLS policies (`20240317_rls_policies.sql`)

### Manual Application

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Copy the contents of the migration file (`migrations/20240316_initial_schema.sql`)
4. Paste into the SQL Editor and run the query
5. Then apply the RLS policies by running the contents of `migrations/20240317_rls_policies.sql`

## Local Development vs Production Configuration

This project includes separate configurations for local development and production environments:

### Local Development (Email Verification Disabled)

For local development, email verification is disabled to make testing easier. To use the local development configuration:

```bash
./supabase/scripts/set-env.sh local
```

This will:
- Disable email confirmations
- Disable secure password change
- Restart Supabase with the local configuration

### Production (Email Verification Enabled)

For production, email verification is enabled for better security. To use the production configuration:

```bash
./supabase/scripts/set-env.sh prod
```

This will:
- Enable email confirmations
- Enable secure password change
- Restart Supabase with the production configuration

### Configuration Files

- `config.toml`: Main configuration file (used for production)
- `config.local.toml`: Local development configuration overrides
- `config.active.toml`: The currently active configuration (created by the script)

## TypeScript Integration

TypeScript types that match this schema are available in `src/types/database.types.ts`. These types provide type safety when working with the database in your application.

Example usage with Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Type-safe query
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'chef');
```

## Best Practices

1. **Always use the TypeScript types** when interacting with the database to ensure type safety
2. **Use transactions** for operations that modify multiple tables to ensure data consistency
3. **Respect RLS policies** by designing your application to work within the security constraints
4. **Consider caching** frequently accessed data to improve performance
5. **Implement proper error handling** for database operations 