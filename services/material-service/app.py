from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# Database Configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'buildpro_db'
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/')
def home():
    return jsonify({
        "service": "Material Service",
        "language": "Python",
        "status": "Active"
    })

@app.route('/materials', methods=['GET'])
def get_materials():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM materials ORDER BY name')
        rows = cursor.fetchall()
        
        # Calculate statistics
        total_sku = len(rows)
        total_assets = sum(item['stock'] * item['price'] for item in rows)
        low_stock_count = sum(1 for item in rows if item['status'] == 'Low Stock' or item['stock'] < 10)
        
        return jsonify({
            "success": True,
            "count": len(rows),
            "statistics": {
                "totalSKU": total_sku,
                "totalAssets": total_assets,
                "lowStockCount": low_stock_count
            },
            "data": rows
        })
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/materials', methods=['POST'])
def create_material():
    data = request.get_json()
    name = data.get('name')
    category = data.get('category')
    unit = data.get('unit')
    stock = data.get('stock')
    price = data.get('price')
    
    if not all([name, category, unit, stock is not None, price]):
        return jsonify({"success": False, "message": "All fields are required"}), 400
        
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Determine initial status
        status = 'In Stock' if int(stock) >= 10 else 'Low Stock'
        
        cursor.execute('''
            INSERT INTO materials (name, category, unit, stock, price, status)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (name, category, unit, stock, price, status))
        
        conn.commit()
        new_id = cursor.lastrowid
        
        # Get created material
        cursor.execute('SELECT * FROM materials WHERE id = %s', (new_id,))
        new_material = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": "Material created successfully",
            "data": new_material
        }), 201
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/materials/<int:id>', methods=['GET'])
def get_material_by_id(id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM materials WHERE id = %s', (id,))
        row = cursor.fetchone()
        
        if row:
            return jsonify({"success": True, "data": row})
        else:
            return jsonify({"success": False, "message": "Material not found"}), 404
            
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/materials/restock', methods=['POST'])
def restock_material():
    data = request.get_json()
    material_id = data.get('id')
    qty = data.get('qty')
    
    if not material_id or qty is None:
        return jsonify({"success": False, "message": "id and qty are required"}), 400
        
    if int(qty) < 0:
        return jsonify({"success": False, "message": "Quantity must be positive"}), 400
        
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get current stock
        cursor.execute('SELECT stock, name FROM materials WHERE id = %s', (material_id,))
        current = cursor.fetchone()
        
        if not current:
            return jsonify({"success": False, "message": "Material not found"}), 404
            
        new_stock = current['stock'] + int(qty)
        new_status = 'In Stock' if new_stock >= 10 else 'Low Stock'
        
        # Update stock
        cursor.execute('UPDATE materials SET stock = %s, status = %s WHERE id = %s', 
                       (new_stock, new_status, material_id))
        conn.commit()
        
        # Get updated record
        cursor.execute('SELECT * FROM materials WHERE id = %s', (material_id,))
        updated = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": f"{qty} {current['name']} successfully restocked",
            "data": updated
        })
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# =====================================================
# MATERIAL USAGE ENDPOINTS
# =====================================================

@app.route('/materials/usage', methods=['POST'])
def record_usage():
    """Record material usage and reduce stock"""
    data = request.get_json()
    material_id = data.get('material_id')
    quantity = data.get('quantity')
    project_id = data.get('project_id')
    notes = data.get('notes', '')
    recorded_by = data.get('recorded_by', '')
    
    if not material_id or not quantity:
        return jsonify({"success": False, "message": "material_id and quantity are required"}), 400
        
    if int(quantity) < 0:
        return jsonify({"success": False, "message": "Quantity must be positive"}), 400
        
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get current stock
        cursor.execute('SELECT stock, name, min_stock FROM materials WHERE id = %s', (material_id,))
        material = cursor.fetchone()
        
        if not material:
            return jsonify({"success": False, "message": "Material not found"}), 404
            
        if material['stock'] < int(quantity):
            return jsonify({"success": False, "message": f"Insufficient stock. Available: {material['stock']}"}), 400
            
        # Reduce stock
        new_stock = material['stock'] - int(quantity)
        
        # Determine new status
        if new_stock == 0:
            new_status = 'Out of Stock'
        elif new_stock < material['min_stock']:
            new_status = 'Low Stock'
        else:
            new_status = 'In Stock'
        
        # Update stock
        cursor.execute('UPDATE materials SET stock = %s, status = %s WHERE id = %s', 
                       (new_stock, new_status, material_id))
        
        # Record usage
        from datetime import date
        usage_date = date.today()
        cursor.execute('''
            INSERT INTO material_usage (material_id, project_id, quantity, usage_date, notes, recorded_by)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (material_id, project_id, quantity, usage_date, notes, recorded_by))
        
        conn.commit()
        
        # Get updated material
        cursor.execute('SELECT * FROM materials WHERE id = %s', (material_id,))
        updated = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": f"Usage recorded: {quantity} {material['name']} used",
            "data": updated
        })
        
    except Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/materials/usage/<int:material_id>', methods=['GET'])
def get_usage_history(material_id):
    """Get usage history for a material"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT mu.*, m.name as material_name, p.name as project_name
            FROM material_usage mu
            JOIN materials m ON mu.material_id = m.id
            LEFT JOIN projects p ON mu.project_id = p.id
            WHERE mu.material_id = %s
            ORDER BY mu.usage_date DESC
        ''', (material_id,))
        rows = cursor.fetchall()
        
        return jsonify({"success": True, "count": len(rows), "data": rows})
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# =====================================================
# PURCHASE ORDER ENDPOINTS
# =====================================================

@app.route('/purchase-orders', methods=['GET'])
def get_purchase_orders():
    """Get all purchase orders"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT po.*, m.name as material_name, v.name as vendor_name
            FROM purchase_orders po
            JOIN materials m ON po.material_id = m.id
            LEFT JOIN vendors v ON po.vendor_id = v.id
            ORDER BY po.order_date DESC
        ''')
        rows = cursor.fetchall()
        
        return jsonify({"success": True, "count": len(rows), "data": rows})
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/purchase-orders/<int:po_id>', methods=['GET'])
def get_purchase_order(po_id):
    """Get single purchase order"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT po.*, m.name as material_name, v.name as vendor_name
            FROM purchase_orders po
            JOIN materials m ON po.material_id = m.id
            LEFT JOIN vendors v ON po.vendor_id = v.id
            WHERE po.id = %s
        ''', (po_id,))
        row = cursor.fetchone()
        
        if row:
            return jsonify({"success": True, "data": row})
        else:
            return jsonify({"success": False, "message": "Purchase order not found"}), 404
            
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/purchase-orders', methods=['POST'])
def create_purchase_order():
    """Create new purchase order"""
    data = request.get_json()
    material_id = data.get('material_id')
    vendor_id = data.get('vendor_id')
    quantity = data.get('quantity')
    agreed_price = data.get('agreed_price')
    order_date = data.get('order_date')
    expected_delivery = data.get('expected_delivery')
    notes = data.get('notes', '')
    created_by = data.get('created_by', '')
    
    if not all([material_id, quantity, agreed_price, order_date]):
        return jsonify({"success": False, "message": "material_id, quantity, agreed_price, and order_date are required"}), 400
        
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Verify material exists
        cursor.execute('SELECT name FROM materials WHERE id = %s', (material_id,))
        material = cursor.fetchone()
        if not material:
            return jsonify({"success": False, "message": "Material not found"}), 404
        
        # Create PO
        cursor.execute('''
            INSERT INTO purchase_orders (material_id, vendor_id, quantity, agreed_price, status, order_date, expected_delivery, notes, created_by)
            VALUES (%s, %s, %s, %s, 'Pending', %s, %s, %s, %s)
        ''', (material_id, vendor_id, quantity, agreed_price, order_date, expected_delivery, notes, created_by))
        
        po_id = cursor.lastrowid
        conn.commit()
        
        # Get created PO
        cursor.execute('SELECT * FROM purchase_orders WHERE id = %s', (po_id,))
        created_po = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": "Purchase order created successfully",
            "data": created_po
        }), 201
        
    except Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/purchase-orders/<int:po_id>/receive', methods=['PUT'])
def receive_purchase_order(po_id):
    """Mark purchase order as received and update stock"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get PO details
        cursor.execute('SELECT * FROM purchase_orders WHERE id = %s', (po_id,))
        po = cursor.fetchone()
        
        if not po:
            return jsonify({"success": False, "message": "Purchase order not found"}), 404
            
        if po['status'] == 'Delivered':
            return jsonify({"success": False, "message": "Purchase order already delivered"}), 400
        
        # Update PO status
        from datetime import date
        actual_delivery = date.today()
        cursor.execute('''
            UPDATE purchase_orders 
            SET status = 'Delivered', actual_delivery = %s
            WHERE id = %s
        ''', (actual_delivery, po_id))
        
        # Update material stock
        cursor.execute('SELECT stock, min_stock FROM materials WHERE id = %s', (po['material_id'],))
        material = cursor.fetchone()
        
        new_stock = material['stock'] + po['quantity']
        new_status = 'In Stock' if new_stock >= material['min_stock'] else 'Low Stock'
        
        cursor.execute('UPDATE materials SET stock = %s, status = %s WHERE id = %s',
                       (new_stock, new_status, po['material_id']))
        
        conn.commit()
        
        # Get updated PO
        cursor.execute('SELECT * FROM purchase_orders WHERE id = %s', (po_id,))
        updated_po = cursor.fetchone()
        
        return jsonify({
            "success": True,
            "message": "Purchase order received and stock updated",
            "data": updated_po
        })
        
    except Error as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/purchase-orders/<int:po_id>/status', methods=['PUT'])
def update_po_status(po_id):
    """Update purchase order status"""
    data = request.get_json()
    status = data.get('status')
    
    if not status:
        return jsonify({"success": False, "message": "status is required"}), 400
        
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Check if PO exists
        cursor.execute('SELECT * FROM purchase_orders WHERE id = %s', (po_id,))
        po = cursor.fetchone()
        if not po:
            return jsonify({"success": False, "message": "Purchase order not found"}), 404
            
        # Update status
        cursor.execute('UPDATE purchase_orders SET status = %s WHERE id = %s', (status, po_id))
        conn.commit()
        
        return jsonify({"success": True, "message": f"Status updated to {status}"})
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/materials/<string:material_name>/compare-prices', methods=['GET'])
def compare_prices(material_name):
    """Compare prices for a specific material across vendors"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"success": False, "message": "Database connection failed"}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Query vendor_materials to find same material from different vendors
        # Using LIKE for partial match to find similar items
        search_term = f"%{material_name}%"
        
        cursor.execute('''
            SELECT vm.*, v.name as vendor_name, v.rating as vendor_rating
            FROM vendor_materials vm
            JOIN vendors v ON vm.vendor_id = v.id
            WHERE vm.material_name LIKE %s
            ORDER BY vm.price ASC
        ''', (search_term,))
        
        rows = cursor.fetchall()
        
        return jsonify({
            "success": True, 
            "count": len(rows), 
            "data": rows,
            "searched_for": material_name
        })
        
    except Error as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    print("🚀 Material Service (Python) running on port 5002")
    app.run(port=5002, debug=True)
