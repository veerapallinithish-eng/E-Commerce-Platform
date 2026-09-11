import re
import os
import uuid
import mysql.connector
from flask import Flask, request, jsonify, session
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import timedelta

# --------------------------------------------------
# APP CONFIGURATION
# --------------------------------------------------

app = Flask(__name__)
app.secret_key = "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY"
app.permanent_session_lifetime = timedelta(days=7)

# Allow the React dev server to send cookies from the local Vite ports.
CORS(
    app,
    supports_credentials=True,
    origins=[
        f"http://{host}:{port}"
        for host in ("localhost", "127.0.0.1", "[::1]")
        for port in range(5173, 5181)
    ]
)

bcrypt = Bcrypt(app)

# --------------------------------------------------
# FILE UPLOAD CONFIGURATION
# --------------------------------------------------

UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename):
    """Check if file extension is allowed."""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in ALLOWED_EXTENSIONS

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "ecommerce"
}


def get_db_connection():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS product_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            display_order INT NOT NULL DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
        """
    )
    conn.commit()
    cursor.close()
    return conn


def delete_local_image(image_url):
    """Delete an uploaded image while leaving external URLs untouched."""
    if not image_url or not image_url.startswith('/static/uploads/'):
        return

    filename = secure_filename(image_url.rsplit('/', 1)[-1])
    if not filename:
        return

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.isfile(filepath):
        os.remove(filepath)


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

# Password policy: at least 8 characters, containing at least one
# uppercase letter, one lowercase letter, one digit, and one special
# character. Adjust SPECIAL_CHARS or the regex below if your policy
# needs to allow/require a different character set.
SPECIAL_CHARS = r"!@#$%^&*()_\-+=\[\]{}|\\:;\"'<>,.?/~`"

PASSWORD_RULES = [
    (r".{8,}", "Password must be at least 8 characters long."),
    (r"[A-Z]", "Password must contain at least one uppercase letter."),
    (r"[a-z]", "Password must contain at least one lowercase letter."),
    (r"[0-9]", "Password must contain at least one number."),
    (rf"[{SPECIAL_CHARS}]", "Password must contain at least one special character."),
]


def validate_password(password):
    """Returns a list of error messages; empty list means the password is valid."""
    if not password:
        return ["Password is required."]

    errors = [message for pattern, message in PASSWORD_RULES if not re.search(pattern, password)]
    return errors


def login_required(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT 1 FROM users WHERE id = %s", (session["user_id"],))
            exists = cursor.fetchone()
        finally:
            cursor.close()
            conn.close()

        if not exists:
            session.clear()
            return jsonify({"error": "Your session has expired, please log in again"}), 401

        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if session.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


# --------------------------------------------------
# AUTH ROUTES
# --------------------------------------------------

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    # Public registration always creates a customer account. Admin accounts
    # must be created directly in the database or by an existing admin —
    # never accept a client-supplied role here.
    role = "customer"

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    password_errors = validate_password(password)
    if password_errors:
        return jsonify({
            "error": "Password does not meet the required strength.",
            "details": password_errors
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        conn.commit()

        user_id = cursor.lastrowid

        session.permanent = True
        session["user_id"] = user_id
        session["role"] = role
        session["name"] = name

        return jsonify({
            "id": user_id,
            "name": name,
            "email": email,
            "role": role
        }), 201

    finally:
        cursor.close()
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        session.permanent = True
        session["user_id"] = user["id"]
        session["role"] = user["role"]
        session["name"] = user["name"]

        return jsonify({
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/logout", methods=["GET"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


@app.route("/api/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    return jsonify({
        "id": session["user_id"],
        "name": session["name"],
        "role": session["role"]
    }), 200


# --------------------------------------------------
# FILE UPLOAD ROUTES (ADMIN ONLY)
# --------------------------------------------------

@app.route("/api/upload", methods=["POST"])
@admin_required
def upload_image():
    """Upload an image file and return its path."""
    if 'image' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    safe_filename = secure_filename(file.filename)
    if not safe_filename or not allowed_file(safe_filename):
        return jsonify({"error": "Invalid file type. Allowed: PNG, JPG, JPEG, WebP"}), 400

    # Check file size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning

    if file_size > MAX_FILE_SIZE:
        return jsonify({"error": f"File too large. Maximum size: 2 MB"}), 400

    try:
        # Generate a unique filename to prevent overwrites
        ext = safe_filename.rsplit('.', 1)[-1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)

        # Save the file
        file.save(filepath)

        # Return the path to be stored in database
        image_url = f"/static/uploads/{unique_name}"
        return jsonify({"image_url": image_url}), 201

    except Exception as e:
        app.logger.exception("File upload failed")
        return jsonify({"error": "File upload failed"}), 500


# --------------------------------------------------
# PRODUCT ROUTES (PUBLIC)
# --------------------------------------------------

@app.route("/api/products", methods=["GET"])
def get_products():
    category = request.args.get("category")
    search = request.args.get("search")
    sort = request.args.get("sort")
    try:
        page = max(int(request.args.get("page", 1)), 1)
        limit = min(max(int(request.args.get("limit", 8)), 1), 100)
    except (TypeError, ValueError):
        return jsonify({"error": "page and limit must be valid numbers"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        filters = []
        params = []

        if category:
            filters.append("c.name = %s")
            params.append(category)

        if search:
            filters.append("(p.name LIKE %s OR p.description LIKE %s)")
            like_term = f"%{search}%"
            params.extend([like_term, like_term])

        where_clause = " AND ".join(filters) if filters else "1=1"

        cursor.execute(
            f"""
            SELECT COUNT(*) AS total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE {where_clause}
            """,
            params
        )
        total = cursor.fetchone()["total"]

        query = f"""
            SELECT p.*, c.name AS category_name,
                   COALESCE(r.avg_rating, 0) AS avg_rating,
                   COALESCE(r.rating_count, 0) AS rating_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count
                FROM ratings
                GROUP BY product_id
            ) r ON r.product_id = p.id
            WHERE {where_clause}
        """

        if sort == "price_asc":
            query += " ORDER BY p.price ASC"
        elif sort == "price_desc":
            query += " ORDER BY p.price DESC"
        elif sort == "newest":
            query += " ORDER BY p.created_at DESC"
        else:
            query += " ORDER BY p.id ASC"

        offset = (page - 1) * limit
        cursor.execute(query + " LIMIT %s OFFSET %s", params + [limit, offset])
        products = cursor.fetchall()

        for product in products:
            cursor.execute(
                "SELECT image_url FROM product_images WHERE product_id = %s ORDER BY display_order, id",
                (product["id"],)
            )
            product["gallery"] = [row["image_url"] for row in cursor.fetchall()]
            if product["image_url"] and product["image_url"] not in product["gallery"]:
                product["gallery"].insert(0, product["image_url"])

        return jsonify({
            "products": products,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT p.*, c.name AS category_name,
                   COALESCE(r.avg_rating, 0) AS avg_rating,
                   COALESCE(r.rating_count, 0) AS rating_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count
                FROM ratings
                GROUP BY product_id
            ) r ON r.product_id = p.id
            WHERE p.id = %s
            """,
            (product_id,)
        )
        product = cursor.fetchone()

        if not product:
            return jsonify({"error": "Product not found"}), 404

        cursor.execute(
            "SELECT image_url FROM product_images WHERE product_id = %s ORDER BY display_order, id",
            (product_id,)
        )
        product["gallery"] = [row["image_url"] for row in cursor.fetchall()]
        if product["image_url"] and product["image_url"] not in product["gallery"]:
            product["gallery"].insert(0, product["image_url"])

        return jsonify(product), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM categories ORDER BY name ASC")
        categories = cursor.fetchall()
        return jsonify(categories), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# PRODUCT ROUTES (ADMIN ONLY)
# --------------------------------------------------

@app.route("/api/products", methods=["POST"])
@admin_required
def create_product():
    data = request.get_json()

    required_fields = ["name", "price", "stock", "category_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    image_urls = data.get("image_urls") or ([data["image_url"]] if data.get("image_url") else [])

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO products (name, description, price, stock, category_id, image_url)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                data["name"],
                data.get("description", ""),
                data["price"],
                data["stock"],
                data["category_id"],
                image_urls[0] if image_urls else ""
            )
        )
        product_id = cursor.lastrowid
        for display_order, image_url in enumerate(image_urls):
            cursor.execute(
                "INSERT INTO product_images (product_id, image_url, display_order) VALUES (%s, %s, %s)",
                (product_id, image_url, display_order)
            )
        conn.commit()

        return jsonify({"id": product_id, "message": "Product created successfully"}), 201

    finally:
        cursor.close()
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()

        if not product:
            return jsonify({"error": "Product not found"}), 404

        cursor.execute(
            "SELECT image_url FROM product_images WHERE product_id = %s",
            (product_id,)
        )
        old_gallery = [row["image_url"] for row in cursor.fetchall()]
        image_urls = data.get("image_urls")
        if image_urls is None:
            image_urls = [data.get("image_url", product["image_url"])] if data.get("image_url", product["image_url"]) else []
        image_url = image_urls[0] if image_urls else ""

        cursor.execute(
            """
            UPDATE products
            SET name = %s, description = %s, price = %s,
                stock = %s, category_id = %s, image_url = %s
            WHERE id = %s
            """,
            (
                data.get("name", product["name"]),
                data.get("description", product["description"]),
                data.get("price", product["price"]),
                data.get("stock", product["stock"]),
                data.get("category_id", product["category_id"]),
                image_url,
                product_id
            )
        )
        cursor.execute("DELETE FROM product_images WHERE product_id = %s", (product_id,))
        for display_order, gallery_url in enumerate(image_urls):
            cursor.execute(
                "INSERT INTO product_images (product_id, image_url, display_order) VALUES (%s, %s, %s)",
                (product_id, gallery_url, display_order)
            )
        conn.commit()

        for old_url in set(old_gallery + ([product["image_url"]] if product["image_url"] else [])) - set(image_urls):
            delete_local_image(old_url)

        return jsonify({"message": "Product updated successfully"}), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404

        return jsonify({"message": "Product deleted successfully"}), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# PRODUCT RATINGS
# --------------------------------------------------

@app.route("/api/products/<int:product_id>/ratings", methods=["GET"])
def get_product_ratings(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT r.id, r.rating, r.review, r.created_at, u.name AS user_name
            FROM ratings r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = %s
            ORDER BY r.created_at DESC
            """,
            (product_id,)
        )
        ratings = cursor.fetchall()

        avg_rating = 0
        if ratings:
            avg_rating = round(sum(r["rating"] for r in ratings) / len(ratings), 2)

        can_rate = False
        my_rating = None

        if "user_id" in session:
            user_id = session["user_id"]

            # A customer can rate a product only if they purchased it.
            cursor.execute(
                """
                SELECT 1
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE o.user_id = %s AND oi.product_id = %s
                LIMIT 1
                """,
                (user_id, product_id)
            )
            can_rate = cursor.fetchone() is not None

            cursor.execute(
                "SELECT id, rating, review FROM ratings WHERE product_id = %s AND user_id = %s",
                (product_id, user_id)
            )
            my_rating = cursor.fetchone()

        return jsonify({
            "average": avg_rating,
            "count": len(ratings),
            "ratings": ratings,
            "can_rate": can_rate,
            "my_rating": my_rating
        }), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/products/<int:product_id>/ratings", methods=["POST"])
@login_required
def submit_product_rating(product_id):
    data = request.get_json()
    rating = data.get("rating")
    review = data.get("review", "")
    user_id = session["user_id"]

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return jsonify({"error": "Rating must be a number between 1 and 5"}), 400

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        # Only customers who purchased the product may rate it.
        cursor.execute(
            """
            SELECT 1
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = %s AND oi.product_id = %s
            LIMIT 1
            """,
            (user_id, product_id)
        )
        if not cursor.fetchone():
            return jsonify({"error": "You can only rate products you have purchased"}), 403

        cursor.execute(
            """
            INSERT INTO ratings (product_id, user_id, rating, review)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review)
            """,
            (product_id, user_id, rating, review)
        )
        conn.commit()

        return jsonify({"message": "Rating submitted successfully"}), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# WISHLIST (CUSTOMER)
# --------------------------------------------------

@app.route("/api/wishlist", methods=["GET"])
@login_required
def get_wishlist():
    user_id = session["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT p.*, c.name AS category_name, w.created_at AS added_at
            FROM wishlist w
            JOIN products p ON w.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE w.user_id = %s
            ORDER BY w.created_at DESC
            """,
            (user_id,)
        )
        return jsonify(cursor.fetchall()), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/wishlist", methods=["POST"])
@login_required
def add_to_wishlist():
    data = request.get_json()
    product_id = data.get("product_id")
    user_id = session["user_id"]

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        cursor.execute(
            "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (%s, %s)",
            (user_id, product_id)
        )
        conn.commit()

        return jsonify({"message": "Added to wishlist"}), 201

    finally:
        cursor.close()
        conn.close()


@app.route("/api/wishlist/<int:product_id>", methods=["DELETE"])
@login_required
def remove_from_wishlist(product_id):
    user_id = session["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "DELETE FROM wishlist WHERE user_id = %s AND product_id = %s",
            (user_id, product_id)
        )
        conn.commit()

        return jsonify({"message": "Removed from wishlist"}), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# COUPONS
# --------------------------------------------------

@app.route("/api/coupons/validate", methods=["POST"])
@login_required
def validate_coupon():
    data = request.get_json()
    code = (data.get("code") or "").strip().upper()
    subtotal = float(data.get("subtotal", 0))

    if not code:
        return jsonify({"error": "Coupon code is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM coupons WHERE code = %s", (code,))
        coupon = cursor.fetchone()

        if not coupon or not coupon["active"]:
            return jsonify({"error": "Invalid coupon code"}), 404

        if coupon["expires_at"] and coupon["expires_at"] < __import__("datetime").date.today():
            return jsonify({"error": "This coupon has expired"}), 400

        if coupon["max_uses"] is not None and coupon["used_count"] >= coupon["max_uses"]:
            return jsonify({"error": "This coupon has reached its usage limit"}), 400

        if subtotal < float(coupon["min_order_amount"]):
            return jsonify({
                "error": f"This coupon requires a minimum order of "
                         f"₹{float(coupon['min_order_amount']):,.2f}"
            }), 400

        discount_percent = float(coupon["discount_percent"])
        discount_amount = round(subtotal * discount_percent / 100, 2)

        return jsonify({
            "code": coupon["code"],
            "discount_percent": discount_percent,
            "discount_amount": discount_amount
        }), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/coupons", methods=["GET"])
@admin_required
def list_coupons():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM coupons ORDER BY created_at DESC")
        return jsonify(cursor.fetchall()), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/coupons", methods=["POST"])
@admin_required
def create_coupon():
    data = request.get_json()
    code = (data.get("code") or "").strip().upper()
    discount_percent = data.get("discount_percent")

    if not code or discount_percent is None:
        return jsonify({"error": "code and discount_percent are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO coupons (code, discount_percent, min_order_amount, max_uses, active, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                code,
                discount_percent,
                data.get("min_order_amount", 0),
                data.get("max_uses"),
                data.get("active", True),
                data.get("expires_at")
            )
        )
        conn.commit()

        return jsonify({"id": cursor.lastrowid, "message": "Coupon created successfully"}), 201

    except mysql.connector.errors.IntegrityError:
        conn.rollback()
        return jsonify({"error": "A coupon with that code already exists"}), 400

    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/coupons/<int:coupon_id>", methods=["DELETE"])
@admin_required
def delete_coupon(coupon_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM coupons WHERE id = %s", (coupon_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Coupon not found"}), 404

        return jsonify({"message": "Coupon deleted successfully"}), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# ADMIN SALES SUMMARY
# --------------------------------------------------

@app.route("/api/admin/summary", methods=["GET"])
@admin_required
def admin_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COALESCE(AVG(total_amount), 0) AS avg_order_value
            FROM orders
            WHERE status != 'Cancelled'
            """
        )
        totals = cursor.fetchone()

        cursor.execute(
            """
            SELECT status, COUNT(*) AS count
            FROM orders
            GROUP BY status
            """
        )
        by_status = {row["status"]: row["count"] for row in cursor.fetchall()}

        cursor.execute(
            """
            SELECT
                p.id, p.name, p.image_url,
                SUM(oi.quantity) AS units_sold,
                SUM(oi.quantity * oi.unit_price) AS revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'Cancelled'
            GROUP BY p.id, p.name, p.image_url
            ORDER BY units_sold DESC
            LIMIT 5
            """
        )
        top_products = cursor.fetchall()

        cursor.execute("SELECT COUNT(*) AS count FROM products WHERE stock < 5")
        low_stock_count = cursor.fetchone()["count"]

        cursor.execute("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'")
        total_customers = cursor.fetchone()["count"]

        return jsonify({
            "total_orders": totals["total_orders"],
            "total_revenue": float(totals["total_revenue"]),
            "avg_order_value": float(totals["avg_order_value"]),
            "orders_by_status": by_status,
            "top_products": top_products,
            "low_stock_count": low_stock_count,
            "total_customers": total_customers
        }), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# ORDER ROUTES (CUSTOMER)
# --------------------------------------------------

@app.route("/api/orders", methods=["POST"])
@login_required
def create_order():
    data = request.get_json()
    items = data.get("items")
    address = data.get("address")
    coupon_code = (data.get("coupon_code") or "").strip().upper()

    if not items or not isinstance(items, list) or len(items) == 0:
        return jsonify({"error": "Order must contain at least one item"}), 400

    if not address:
        return jsonify({"error": "Delivery address is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # --------------------------------------------------
        # STEP 1: Validate stock for every item BEFORE
        # making any changes
        # --------------------------------------------------
        product_cache = {}
        subtotal_amount = 0

        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity")

            if not product_id or not quantity or quantity <= 0:
                return jsonify({"error": "Invalid item in order"}), 400

            cursor.execute("SELECT * FROM products WHERE id = %s FOR UPDATE", (product_id,))
            product = cursor.fetchone()

            if not product:
                return jsonify({"error": f"Product {product_id} not found"}), 400

            if product["stock"] < quantity:
                return jsonify({
                    "error": f"Insufficient stock for '{product['name']}'. "
                             f"Available: {product['stock']}, Requested: {quantity}"
                }), 400

            product_cache[product_id] = product
            subtotal_amount += float(product["price"]) * quantity

        # --------------------------------------------------
        # STEP 1B: Validate and apply the coupon, if any
        # --------------------------------------------------
        discount_amount = 0
        applied_coupon_code = None

        if coupon_code:
            cursor.execute("SELECT * FROM coupons WHERE code = %s", (coupon_code,))
            coupon = cursor.fetchone()

            if not coupon or not coupon["active"]:
                return jsonify({"error": "Invalid coupon code"}), 400

            import datetime as _dt
            if coupon["expires_at"] and coupon["expires_at"] < _dt.date.today():
                return jsonify({"error": "This coupon has expired"}), 400

            if coupon["max_uses"] is not None and coupon["used_count"] >= coupon["max_uses"]:
                return jsonify({"error": "This coupon has reached its usage limit"}), 400

            if subtotal_amount < float(coupon["min_order_amount"]):
                return jsonify({
                    "error": f"This coupon requires a minimum order of "
                             f"₹{float(coupon['min_order_amount']):,.2f}"
                }), 400

            discount_amount = round(subtotal_amount * float(coupon["discount_percent"]) / 100, 2)
            applied_coupon_code = coupon["code"]

            cursor.execute(
                "UPDATE coupons SET used_count = used_count + 1 WHERE id = %s",
                (coupon["id"],)
            )

        total_amount = round(subtotal_amount - discount_amount, 2)

        # --------------------------------------------------
        # STEP 2: All items validated — create the order
        # --------------------------------------------------
        user_id = session["user_id"]

        cursor.execute(
            """
            INSERT INTO orders
                (user_id, subtotal_amount, discount_amount, total_amount, coupon_code, status, address)
            VALUES (%s, %s, %s, %s, %s, 'Pending', %s)
            """,
            (user_id, subtotal_amount, discount_amount, total_amount, applied_coupon_code, address)
        )
        order_id = cursor.lastrowid

        # --------------------------------------------------
        # STEP 3: Create order_items and reduce stock
        # --------------------------------------------------
        for item in items:
            product_id = item["product_id"]
            quantity = item["quantity"]
            product = product_cache[product_id]

            cursor.execute(
                """
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, product_id, quantity, product["price"])
            )

            cursor.execute(
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (quantity, product_id)
            )

        conn.commit()

        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "subtotal_amount": subtotal_amount,
            "discount_amount": discount_amount,
            "total_amount": total_amount
        }), 201

    except Exception:
        conn.rollback()
        app.logger.exception("Failed to create order")
        return jsonify({"error": "Could not place order, please try again"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/orders/my", methods=["GET"])
@login_required
def get_my_orders():
    user_id = session["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM orders WHERE user_id = %s ORDER BY ordered_at DESC",
            (user_id,)
        )
        orders = cursor.fetchall()

        for order in orders:
            cursor.execute(
                """
                SELECT oi.*, p.name AS product_name, p.image_url
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
                """,
                (order["id"],)
            )
            order["items"] = cursor.fetchall()

        return jsonify(orders), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# ORDER ROUTES (ADMIN ONLY)
# --------------------------------------------------

@app.route("/api/orders", methods=["GET"])
@admin_required
def get_all_orders():
    try:
        page = max(int(request.args.get("page", 1)), 1)
        limit = min(max(int(request.args.get("limit", 10)), 1), 100)
    except (TypeError, ValueError):
        return jsonify({"error": "page and limit must be valid numbers"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT COUNT(*) AS total FROM orders")
        total = cursor.fetchone()["total"]
        offset = (page - 1) * limit

        cursor.execute(
            """
            SELECT o.*, u.name AS customer_name, u.email AS customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.ordered_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset)
        )
        orders = cursor.fetchall()

        for order in orders:
            cursor.execute(
                """
                SELECT oi.*, p.name AS product_name
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
                """,
                (order["id"],)
            )
            order["items"] = cursor.fetchall()

        return jsonify({
            "orders": orders,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }), 200

    finally:
        cursor.close()
        conn.close()


@app.route("/api/orders/<int:order_id>/status", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.get_json()
    status = data.get("status")

    valid_statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"]
    if status not in valid_statuses:
        return jsonify({"error": f"Status must be one of {valid_statuses}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "UPDATE orders SET status = %s WHERE id = %s",
            (status, order_id)
        )
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Order not found"}), 404

        return jsonify({"message": "Order status updated successfully"}), 200

    finally:
        cursor.close()
        conn.close()


# --------------------------------------------------
# RUN
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=False, port=5000)
