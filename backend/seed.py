import mysql.connector
from flask_bcrypt import Bcrypt

# --------------------------------------------------
# DATABASE CONFIGURATION
# --------------------------------------------------

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "ecommerce"
}

bcrypt = Bcrypt()


# --------------------------------------------------
# CONNECT TO DATABASE
# --------------------------------------------------

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


# --------------------------------------------------
# SEED DATA
# --------------------------------------------------

CATEGORIES = [
    "Electronics",
    "Clothing",
    "Home & Kitchen",
    "Sports & Outdoors"
]

# Real product photography, sourced from Pexels and Unsplash (both offer
# free-to-use licenses with no attribution required). Each URL was verified
# to point at a real, live photo matching the product before being added
# here — swap in your own product photography / CDN when you're ready.

REAL_IMAGES = {
    "Wireless Bluetooth Headphones": "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=600&q=80",
    "Smartphone Stand": "https://images.unsplash.com/photo-1698314440355-eaf5ff14899c?auto=format&fit=crop&w=600&q=80",
    "Portable Power Bank 20000mAh": "https://images.pexels.com/photos/3921704/pexels-photo-3921704.jpeg?auto=compress&cs=tinysrgb&w=600",
    "4K Webcam": "https://images.pexels.com/photos/16547328/pexels-photo-16547328.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Mechanical Keyboard": "https://images.pexels.com/photos/671629/pexels-photo-671629.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Wireless Mouse": "https://images.pexels.com/photos/17821147/pexels-photo-17821147.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Men's Cotton T-Shirt": "https://images.pexels.com/photos/11671964/pexels-photo-11671964.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Women's Denim Jacket": "https://images.pexels.com/photos/36607477/pexels-photo-36607477.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Running Shoes": "https://images.pexels.com/photos/19577862/pexels-photo-19577862.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Wool Blend Sweater": "https://images.pexels.com/photos/6757412/pexels-photo-6757412.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Baseball Cap": "https://images.pexels.com/photos/12712906/pexels-photo-12712906.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Formal Dress Shirt": "https://images.pexels.com/photos/901424/pexels-photo-901424.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Stainless Steel Cookware Set": "https://images.pexels.com/photos/5782042/pexels-photo-5782042.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Electric Kettle": "https://images.pexels.com/photos/6508341/pexels-photo-6508341.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Memory Foam Pillow": "https://images.pexels.com/photos/5858234/pexels-photo-5858234.jpeg?auto=compress&cs=tinysrgb&w=600",
    "LED Desk Lamp": "https://images.pexels.com/photos/923311/pexels-photo-923311.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Blender": "https://images.pexels.com/photos/6824660/pexels-photo-6824660.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Yoga Mat": "https://images.pexels.com/photos/7318664/pexels-photo-7318664.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Adjustable Dumbbell Set": "https://images.pexels.com/photos/16513597/pexels-photo-16513597.jpeg?auto=compress&cs=tinysrgb&w=600",
    "Insulated Water Bottle": "https://images.pexels.com/photos/3737800/pexels-photo-3737800.jpeg?auto=compress&cs=tinysrgb&w=600",
}

CATEGORY_COLORS = {
    "Electronics": "1a73e8",       # blue
    "Clothing": "d93025",          # red
    "Home & Kitchen": "188038",    # green
    "Sports & Outdoors": "e8710a"  # orange
}


def placeholder_img(name, category):
    """Fallback only — used if a product name isn't found in REAL_IMAGES."""
    color = CATEGORY_COLORS.get(category, "666666")
    text = name.replace(" ", "+").replace("&", "and")
    return f"https://placehold.co/400x400/{color}/FFFFFF?text={text}"


def product_img(name, category):
    return REAL_IMAGES.get(name) or placeholder_img(name, category)


# --------------------------------------------------
# CURRENCY: all prices are stored and displayed in
# Indian Rupees (INR). USD source prices below are
# converted using an approximate USD -> INR rate and
# rounded to a natural "...99" INR price point.
# --------------------------------------------------
USD_TO_INR_RATE = 95.60


def usd_to_inr(usd_amount):
    raw = usd_amount * USD_TO_INR_RATE
    return round(raw / 10) * 10 - 1


# (name, description, price_usd, stock, category_name)
_RAW_PRODUCTS = [
    # Electronics
    ("Wireless Bluetooth Headphones", "Over-ear headphones with noise cancellation and 30-hour battery life.", 59.99, 45, "Electronics"),
    ("Smartphone Stand", "Adjustable aluminum stand compatible with all phone sizes.", 14.99, 120, "Electronics"),
    ("Portable Power Bank 20000mAh", "Fast-charging power bank with dual USB output.", 29.99, 80, "Electronics"),
    ("4K Webcam", "USB webcam with autofocus, ideal for streaming and video calls.", 45.50, 30, "Electronics"),
    ("Mechanical Keyboard", "RGB backlit mechanical keyboard with blue switches.", 79.99, 25, "Electronics"),
    ("Wireless Mouse", "Ergonomic wireless mouse with adjustable DPI.", 19.99, 100, "Electronics"),

    # Clothing
    ("Men's Cotton T-Shirt", "Comfortable crew-neck t-shirt, available in multiple colors.", 12.99, 150, "Clothing"),
    ("Women's Denim Jacket", "Classic fit denim jacket with button closure.", 49.99, 40, "Clothing"),
    ("Running Shoes", "Lightweight breathable running shoes with cushioned sole.", 64.99, 60, "Clothing"),
    ("Wool Blend Sweater", "Warm pullover sweater, perfect for winter.", 39.99, 35, "Clothing"),
    ("Baseball Cap", "Adjustable cotton cap with embroidered logo.", 9.99, 200, "Clothing"),
    ("Formal Dress Shirt", "Slim-fit long-sleeve shirt for formal occasions.", 34.99, 50, "Clothing"),

    # Home & Kitchen
    ("Stainless Steel Cookware Set", "10-piece non-stick cookware set for everyday cooking.", 89.99, 20, "Home & Kitchen"),
    ("Electric Kettle", "1.7L rapid-boil electric kettle with auto shut-off.", 24.99, 55, "Home & Kitchen"),
    ("Memory Foam Pillow", "Ergonomic pillow that contours to your neck and head.", 22.50, 70, "Home & Kitchen"),
    ("LED Desk Lamp", "Dimmable LED lamp with adjustable arm and USB port.", 27.99, 65, "Home & Kitchen"),
    ("Blender", "High-speed blender for smoothies and shakes, 600W motor.", 34.99, 3, "Home & Kitchen"),

    # Sports & Outdoors
    ("Yoga Mat", "Non-slip 6mm thick yoga mat with carrying strap.", 18.99, 90, "Sports & Outdoors"),
    ("Adjustable Dumbbell Set", "Pair of adjustable dumbbells, 5-25 lbs each.", 99.99, 15, "Sports & Outdoors"),
    ("Insulated Water Bottle", "Stainless steel bottle that keeps drinks cold for 24 hours.", 16.99, 4, "Sports & Outdoors"),
]

PRODUCTS = [
    (name, description, usd_to_inr(price_usd), stock, category, product_img(name, category))
    for name, description, price_usd, stock, category in _RAW_PRODUCTS
]


def seed_database():

    conn = get_connection()
    cursor = conn.cursor()

    try:
        print("Starting database seeding...")

        # --------------------------------------------------
        # CLEAR EXISTING DATA (order matters due to FKs)
        # --------------------------------------------------
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        cursor.execute("TRUNCATE TABLE ratings")
        cursor.execute("TRUNCATE TABLE wishlist")
        cursor.execute("TRUNCATE TABLE coupons")
        cursor.execute("TRUNCATE TABLE order_items")
        cursor.execute("TRUNCATE TABLE orders")
        cursor.execute("TRUNCATE TABLE products")
        cursor.execute("TRUNCATE TABLE categories")
        cursor.execute("TRUNCATE TABLE users")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

        # --------------------------------------------------
        # USERS
        # --------------------------------------------------

        admin_password = bcrypt.generate_password_hash("admin123").decode("utf-8")
        customer_password = bcrypt.generate_password_hash("customer123").decode("utf-8")

        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            ("Admin User", "trendadmin@ecommerce.com", admin_password, "admin")
        )

        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            ("Test Customer", "customer@ecommerce.com", customer_password, "customer")
        )

        conn.commit()
        print("Users seeded successfully.")

        # --------------------------------------------------
        # CATEGORIES
        # --------------------------------------------------

        category_ids = {}

        for category_name in CATEGORIES:
            cursor.execute(
                "INSERT INTO categories (name) VALUES (%s)",
                (category_name,)
            )
            category_ids[category_name] = cursor.lastrowid

        conn.commit()
        print("Categories seeded successfully.")

        # --------------------------------------------------
        # PRODUCTS
        # --------------------------------------------------

        for name, description, price, stock, category_name, image_url in PRODUCTS:
            cursor.execute(
                """
                INSERT INTO products
                    (name, description, price, stock, category_id, image_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (name, description, price, stock, category_ids[category_name], image_url)
            )

        conn.commit()
        print("Products seeded successfully.")

        # --------------------------------------------------
        # COUPONS
        # --------------------------------------------------

        # Minimum order amounts are in INR (SAVE20 required a $50 minimum,
        # now approximately ₹4,780 at the seeded USD -> INR rate).
        COUPONS = [
            ("WELCOME10", 10, 0, None, True, None),
            ("SAVE20", 20, 4780, 100, True, None),
            ("FLASH25", 25, 0, 50, True, "2026-12-31"),
        ]

        for code, discount_percent, min_order_amount, max_uses, active, expires_at in COUPONS:
            cursor.execute(
                """
                INSERT INTO coupons (code, discount_percent, min_order_amount, max_uses, active, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (code, discount_percent, min_order_amount, max_uses, active, expires_at)
            )

        conn.commit()
        print("Coupons seeded successfully.")

        # --------------------------------------------------
        # SAMPLE ORDER + RATINGS FOR THE TEST CUSTOMER
        # (so the "rate a product you purchased" flow, the
        # ratings shown on Home/ProductDetail, and the admin
        # sales summary all have real data to show off)
        # --------------------------------------------------

        cursor.execute("SELECT id FROM users WHERE email = %s", ("customer@ecommerce.com",))
        customer_id = cursor.fetchone()[0]

        cursor.execute("SELECT id, price FROM products ORDER BY id ASC LIMIT 4")
        sample_products = cursor.fetchall()

        sample_total = sum(float(price) for _id, price in sample_products)

        cursor.execute(
            """
            INSERT INTO orders (user_id, subtotal_amount, discount_amount, total_amount, status, address)
            VALUES (%s, %s, 0, %s, 'Delivered', %s)
            """,
            (customer_id, sample_total, sample_total, "123 Market Street, Springfield")
        )
        sample_order_id = cursor.lastrowid

        for product_id, price in sample_products:
            cursor.execute(
                """
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, 1, %s)
                """,
                (sample_order_id, product_id, price)
            )

        sample_ratings = [5, 4, 5, 3]
        sample_reviews = [
            "Exactly as described, works great!",
            "Good value for the price.",
            "Exceeded my expectations, will buy again.",
            "Decent, but shipping took a while."
        ]

        for (product_id, _price), rating, review in zip(sample_products, sample_ratings, sample_reviews):
            cursor.execute(
                """
                INSERT INTO ratings (product_id, user_id, rating, review)
                VALUES (%s, %s, %s, %s)
                """,
                (product_id, customer_id, rating, review)
            )

        conn.commit()
        print("Sample order and ratings seeded successfully.")

        # --------------------------------------------------
        # SUMMARY
        # --------------------------------------------------

        print("-" * 40)
        print("Database seeding completed successfully!")
        print(f"Categories inserted: {len(CATEGORIES)}")
        print(f"Products inserted: {len(PRODUCTS)}")
        print(f"Coupons inserted: {len(COUPONS)}")
        print("Users inserted: 2")
        print("-" * 40)
        print()
        print("Coupon codes to try at checkout:")
        for code, discount_percent, min_order_amount, *_ in COUPONS:
            note = f" (min order Rs.{min_order_amount:,.2f})" if min_order_amount else ""
            print(f"  {code} — {discount_percent}% off{note}")
        print()
        print("Login credentials:")
        print("Admin:")
        print("  Email: Trendadmin@ecommerce.com")
        print("  Password: admin123")
        print()
        print("Customer:")
        print("  Email: customer@ecommerce.com")
        print("  Password: customer123")

    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Error while seeding database: {err}")

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# ENTRY POINT
# --------------------------------------------------

if __name__ == "__main__":
    seed_database()
