package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

// Helper function to get environment variable with default
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Count   int         `json:"count,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type Vendor struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	ContactPerson string  `json:"contact_person"`
	Phone         string  `json:"phone"`
	Email         string  `json:"email"`
	Address       string  `json:"address"`
	Rating        float64 `json:"rating"`
	Status        string  `json:"status"`
	Notes         string  `json:"notes"`
}

type VendorMaterial struct {
	ID               int     `json:"id"`
	VendorID         int     `json:"vendor_id"`
	VendorName       string  `json:"vendor_name,omitempty"`
	MaterialName     string  `json:"material_name"`
	Price            float64 `json:"price"`
	Unit             string  `json:"unit"`
	StockAvailable   int     `json:"stock_available"`
	MinOrderQuantity int     `json:"min_order_quantity"`
	DeliveryTimeDays int     `json:"delivery_time_days"`
	Notes            string  `json:"notes"`
}

var db *sql.DB

func enableCORS(w http.ResponseWriter, r *http.Request) bool {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}

func main() {
	// Database connection from environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "buildpro_db")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s", dbUser, dbPassword, dbHost, dbName)

	var err error
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Test connection
	err = db.Ping()
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}

	fmt.Println("✅ Vendor Service connected to MySQL database:", dbName)

	// Routes
	http.HandleFunc("/", rootHandler)

	// Vendor CRUD routes
	http.HandleFunc("/vendors", vendorsHandler)
	http.HandleFunc("/vendors/", vendorDetailHandler) // for /vendors/:id

	// Vendor Materials routes
	http.HandleFunc("/vendor-materials", vendorMaterialsHandler)
	http.HandleFunc("/vendor-materials/", vendorMaterialDetailHandler)
	http.HandleFunc("/vendor-materials/by-vendor/", vendorMaterialsByVendorHandler)

	// Price comparison
	http.HandleFunc("/materials/price-comparison/", priceComparisonHandler)

	port := getEnv("PORT", "5005")
	fmt.Println("🚀 Vendor Service (Go) running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"service":  "Vendor Service",
		"language": "Go",
		"status":   "Active",
	})
}

// =====================================================
// VENDOR CRUD ENDPOINTS
// =====================================================

func vendorsHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	switch r.Method {
	case "GET":
		getAllVendors(w, r)
	case "POST":
		createVendor(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAllVendors(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, COALESCE(contact_person, ''), COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''), rating, status, COALESCE(notes, '') FROM vendors ORDER BY name")
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}
	defer rows.Close()

	var vendors []Vendor
	for rows.Next() {
		var v Vendor
		err := rows.Scan(&v.ID, &v.Name, &v.ContactPerson, &v.Phone, &v.Email, &v.Address, &v.Rating, &v.Status, &v.Notes)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}
		vendors = append(vendors, v)
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Count:   len(vendors),
		Data:    vendors,
	})
}

func createVendor(w http.ResponseWriter, r *http.Request) {
	var v Vendor
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Invalid request body"})
		return
	}

	if v.Name == "" {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Vendor name is required"})
		return
	}

	result, err := db.Exec(
		"INSERT INTO vendors (name, contact_person, phone, email, address, rating, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		v.Name, v.ContactPerson, v.Phone, v.Email, v.Address, v.Rating, "Active", v.Notes,
	)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	v.ID = int(id)
	v.Status = "Active"

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor created successfully",
		Data:    v,
	})
}

func vendorDetailHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	// Extract ID from path
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[1])
	if err != nil {
		http.Error(w, "Invalid vendor ID", http.StatusBadRequest)
		return
	}

	// Check for sub-resources like /vendors/:id/materials
	if len(parts) >= 3 && parts[2] == "materials" {
		// Check if a specific material ID is provided: /vendors/:id/materials/:materialId
		if len(parts) >= 4 {
			materialID, err := strconv.Atoi(parts[3])
			if err == nil {
				switch r.Method {
				case "PUT":
					updateVendorMaterial(w, r, materialID)
					return
				case "DELETE":
					deleteVendorMaterial(w, materialID)
					return
				}
			}
		}

		switch r.Method {
		case "GET":
			// Re-use existing logic but we need to extract it to a function or call it here
			// Since vendorMaterialsByVendorHandler expects URL parsing, let's just call the logic directly
			getMaterialsByVendorID(w, id)
		case "POST":
			createMaterialForVendor(w, r, id)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	// Standard /vendors/:id operations
	switch r.Method {
	case "GET":
		getVendorByID(w, id)
	case "PUT":
		updateVendor(w, r, id)
	case "DELETE":
		deleteVendor(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getMaterialsByVendorID(w http.ResponseWriter, vendorID int) {
	rows, err := db.Query(`
		SELECT id, vendor_id, material_name, price, unit, stock_available, min_order_quantity, delivery_time_days, COALESCE(notes, '')
		FROM vendor_materials
		WHERE vendor_id = ?
		ORDER BY material_name
	`, vendorID)

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}
	defer rows.Close()

	var materials []VendorMaterial
	for rows.Next() {
		var m VendorMaterial
		err := rows.Scan(&m.ID, &m.VendorID, &m.MaterialName, &m.Price, &m.Unit,
			&m.StockAvailable, &m.MinOrderQuantity, &m.DeliveryTimeDays, &m.Notes)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}
		materials = append(materials, m)
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Count:   len(materials),
		Data:    materials,
	})
}

func createMaterialForVendor(w http.ResponseWriter, r *http.Request, vendorID int) {
	var m VendorMaterial
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Invalid request body"})
		return
	}

	// Force vendor ID from URL
	m.VendorID = vendorID

	if m.MaterialName == "" || m.Price == 0 {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "material_name and price are required"})
		return
	}

	result, err := db.Exec(`
		INSERT INTO vendor_materials (vendor_id, material_name, price, unit, stock_available, min_order_quantity, delivery_time_days, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, m.VendorID, m.MaterialName, m.Price, m.Unit, m.StockAvailable, m.MinOrderQuantity, m.DeliveryTimeDays, m.Notes)

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	m.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor material added successfully",
		Data:    m,
	})
}

func getVendorByID(w http.ResponseWriter, id int) {
	var v Vendor
	err := db.QueryRow(
		"SELECT id, name, contact_person, phone, email, address, rating, status, COALESCE(notes, '') FROM vendors WHERE id = ?", id,
	).Scan(&v.ID, &v.Name, &v.ContactPerson, &v.Phone, &v.Email, &v.Address, &v.Rating, &v.Status, &v.Notes)

	if err == sql.ErrNoRows {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Vendor not found"})
		return
	} else if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	json.NewEncoder(w).Encode(Response{Success: true, Data: v})
}

func updateVendor(w http.ResponseWriter, r *http.Request, id int) {
	var v Vendor
	if err := json.NewDecoder(r.Body).Decode(&v); err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Invalid request body"})
		return
	}

	_, err := db.Exec(
		"UPDATE vendors SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, rating = ?, status = ?, notes = ? WHERE id = ?",
		v.Name, v.ContactPerson, v.Phone, v.Email, v.Address, v.Rating, v.Status, v.Notes, id,
	)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	v.ID = id
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor updated successfully",
		Data:    v,
	})
}

func deleteVendor(w http.ResponseWriter, id int) {
	result, err := db.Exec("DELETE FROM vendors WHERE id = ?", id)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Vendor not found"})
		return
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor deleted successfully",
	})
}

// =====================================================
// VENDOR MATERIALS ENDPOINTS
// =====================================================

func vendorMaterialsHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	switch r.Method {
	case "GET":
		getAllVendorMaterials(w, r)
	case "POST":
		createVendorMaterial(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func getAllVendorMaterials(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT vm.id, vm.vendor_id, v.name as vendor_name, vm.material_name, vm.price, vm.unit, 
		       vm.stock_available, vm.min_order_quantity, vm.delivery_time_days, COALESCE(vm.notes, '')
		FROM vendor_materials vm
		JOIN vendors v ON vm.vendor_id = v.id
		ORDER BY vm.material_name, v.name
	`)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}
	defer rows.Close()

	var materials []VendorMaterial
	for rows.Next() {
		var m VendorMaterial
		err := rows.Scan(&m.ID, &m.VendorID, &m.VendorName, &m.MaterialName, &m.Price, &m.Unit,
			&m.StockAvailable, &m.MinOrderQuantity, &m.DeliveryTimeDays, &m.Notes)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}
		materials = append(materials, m)
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Count:   len(materials),
		Data:    materials,
	})
}

func createVendorMaterial(w http.ResponseWriter, r *http.Request) {
	var m VendorMaterial
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Invalid request body"})
		return
	}

	if m.VendorID == 0 || m.MaterialName == "" || m.Price == 0 {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "vendor_id, material_name, and price are required"})
		return
	}

	result, err := db.Exec(`
		INSERT INTO vendor_materials (vendor_id, material_name, price, unit, stock_available, min_order_quantity, delivery_time_days, notes)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, m.VendorID, m.MaterialName, m.Price, m.Unit, m.StockAvailable, m.MinOrderQuantity, m.DeliveryTimeDays, m.Notes)

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	id, _ := result.LastInsertId()
	m.ID = int(id)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor material added successfully",
		Data:    m,
	})
}

func vendorMaterialDetailHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(parts[1])
	if err != nil {
		http.Error(w, "Invalid material ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case "PUT":
		updateVendorMaterial(w, r, id)
	case "DELETE":
		deleteVendorMaterial(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func updateVendorMaterial(w http.ResponseWriter, r *http.Request, id int) {
	var m VendorMaterial
	if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Invalid request body"})
		return
	}

	_, err := db.Exec(`
		UPDATE vendor_materials 
		SET material_name = ?, price = ?, unit = ?, stock_available = ?, min_order_quantity = ?, delivery_time_days = ?, notes = ?
		WHERE id = ?
	`, m.MaterialName, m.Price, m.Unit, m.StockAvailable, m.MinOrderQuantity, m.DeliveryTimeDays, m.Notes, id)

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	m.ID = id
	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor material updated successfully",
		Data:    m,
	})
}

func deleteVendorMaterial(w http.ResponseWriter, id int) {
	result, err := db.Exec("DELETE FROM vendor_materials WHERE id = ?", id)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		json.NewEncoder(w).Encode(Response{Success: false, Message: "Vendor material not found"})
		return
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Message: "Vendor material deleted successfully",
	})
}

func vendorMaterialsByVendorHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	vendorID, err := strconv.Atoi(parts[2])
	if err != nil {
		http.Error(w, "Invalid vendor ID", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
		SELECT id, vendor_id, material_name, price, unit, stock_available, min_order_quantity, delivery_time_days, COALESCE(notes, '')
		FROM vendor_materials
		WHERE vendor_id = ?
		ORDER BY material_name
	`, vendorID)

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}
	defer rows.Close()

	var materials []VendorMaterial
	for rows.Next() {
		var m VendorMaterial
		err := rows.Scan(&m.ID, &m.VendorID, &m.MaterialName, &m.Price, &m.Unit,
			&m.StockAvailable, &m.MinOrderQuantity, &m.DeliveryTimeDays, &m.Notes)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}
		materials = append(materials, m)
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Count:   len(materials),
		Data:    materials,
	})
}

// =====================================================
// PRICE COMPARISON ENDPOINT
// =====================================================

func priceComparisonHandler(w http.ResponseWriter, r *http.Request) {
	if enableCORS(w, r) {
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract material name from URL
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 3 {
		http.Error(w, "Material name required", http.StatusBadRequest)
		return
	}

	materialName := parts[2]

	rows, err := db.Query(`
		SELECT vm.id, vm.vendor_id, v.name as vendor_name, vm.material_name, vm.price, vm.unit,
		       vm.stock_available, vm.min_order_quantity, vm.delivery_time_days, v.rating, COALESCE(vm.notes, '')
		FROM vendor_materials vm
		JOIN vendors v ON vm.vendor_id = v.id
		WHERE vm.material_name LIKE ?
		ORDER BY vm.price ASC
	`, "%"+materialName+"%")

	if err != nil {
		json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
		return
	}
	defer rows.Close()

	type PriceComparison struct {
		VendorMaterial
		VendorRating float64 `json:"vendor_rating"`
	}

	var comparisons []PriceComparison
	for rows.Next() {
		var c PriceComparison
		err := rows.Scan(&c.ID, &c.VendorID, &c.VendorName, &c.MaterialName, &c.Price, &c.Unit,
			&c.StockAvailable, &c.MinOrderQuantity, &c.DeliveryTimeDays, &c.VendorRating, &c.Notes)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}
		comparisons = append(comparisons, c)
	}

	json.NewEncoder(w).Encode(Response{
		Success: true,
		Count:   len(comparisons),
		Data:    comparisons,
	})
}
