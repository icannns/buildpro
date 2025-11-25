package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	_ "github.com/go-sql-driver/mysql"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

type Material struct {
	ID     int     `json:"id"`
	Name   string  `json:"name"`
	Stock  int     `json:"stock"`
	Unit   string  `json:"unit"`
	Price  float64 `json:"price"`
	Status string  `json:"status"`
}

type UpdatePriceRequest struct {
	ID       int     `json:"id"`
	NewPrice float64 `json:"new_price"`
}

func main() {
	// Database connection
	db, err := sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/buildpro_db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{
			"service":  "Vendor Service",
			"language": "Go",
			"status":   "Active",
		})
	})

	http.HandleFunc("/materials/update-price", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            return
        }

		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req UpdatePriceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Update price
		_, err := db.Exec("UPDATE materials SET price = ? WHERE id = ?", req.NewPrice, req.ID)
		if err != nil {
			json.NewEncoder(w).Encode(Response{Success: false, Message: err.Error()})
			return
		}

		json.NewEncoder(w).Encode(Response{
			Success: true,
			Message: fmt.Sprintf("Price updated to %.2f", req.NewPrice),
		})
	})

	fmt.Println("🚀 Vendor Service (Go) running on port 5003")
	log.Fatal(http.ListenAndServe(":5003", nil))
}
