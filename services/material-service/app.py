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

if __name__ == '__main__':
    print("🚀 Material Service (Python) running on port 5002")
    app.run(port=5002, debug=True)
