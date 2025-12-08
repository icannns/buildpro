import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.json.JSONObject;
import org.json.JSONArray;

public class BudgetServiceMySQL {
    private static final int PORT = Integer.parseInt(System.getenv().getOrDefault("PORT", "5001"));
    private static final String DB_HOST = System.getenv().getOrDefault("DB_HOST", "localhost");
    private static final String DB_USER = System.getenv().getOrDefault("DB_USER", "root");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DB_PASSWORD", "");
    private static final String DB_NAME = System.getenv().getOrDefault("DB_NAME", "buildpro_db");
    private static final String DB_URL = "jdbc:mysql://" + DB_HOST + ":3306/" + DB_NAME;

    private static Connection dbConnection;

    public static void main(String[] args) throws Exception {
        // Initialize database connection
        Class.forName("com.mysql.cj.jdbc.Driver");
        dbConnection = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
        System.out.println("✅ Budget Service connected to MySQL database: " + DB_NAME);

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Define endpoints
        server.createContext("/", new RootHandler());
        server.createContext("/payment-terms", new PaymentTermsHandler());
        server.createContext("/budget/summary", new BudgetSummaryHandler());
        server.createContext("/payments/process-milestone", new MilestoneHandler());

        server.setExecutor(null);
        System.out.println("🚀 Budget Service (Java + MySQL) running on port " + PORT);
        server.start();
    }

    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = "{\"service\": \"Budget Service\", \"language\": \"Java + MySQL\", \"status\": \"Active\"}";
            sendResponse(t, 200, response);
        }
    }

    // =====================================================
    // PAYMENT TERMS ENDPOINTS
    // =====================================================

    static class PaymentTermsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            enableCORS(t);

            if (t.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                t.sendResponseHeaders(204, -1);
                return;
            }

            String path = t.getRequestURI().getPath();
            String[] pathParts = path.split("/");

            try {
                if (t.getRequestMethod().equalsIgnoreCase("GET")) {
                    // GET /payment-terms/:project_id
                    if (pathParts.length == 3) {
                        int projectId = Integer.parseInt(pathParts[2]);
                        getPaymentTermsByProject(t, projectId);
                    } else {
                        sendResponse(t, 400, "{\"success\": false, \"message\": \"Project ID required\"}");
                    }
                } else if (t.getRequestMethod().equalsIgnoreCase("POST")) {
                    createPaymentTerm(t);
                } else if (t.getRequestMethod().equalsIgnoreCase("PUT")) {
                    // PUT /payment-terms/:id/pay (Payment Confirmation)
                    if (pathParts.length == 4 && pathParts[3].equals("pay")) {
                        // RBAC is handled by API Gateway - trust the gateway
                        // API Gateway already validates that only ADMIN/MANAGER can access this
                        // endpoint
                        int id = Integer.parseInt(pathParts[2]);
                        confirmPayment(t, id);
                    }
                    // PUT /payment-terms/:id (Update Term)
                    else if (pathParts.length == 3) {
                        int id = Integer.parseInt(pathParts[2]);
                        updatePaymentTerm(t, id);
                    } else {
                        sendResponse(t, 400, "{\"success\": false, \"message\": \"Invalid request format\"}");
                    }
                } else if (t.getRequestMethod().equalsIgnoreCase("DELETE")) {
                    // DELETE /payment-terms/:id
                    if (pathParts.length == 3) {
                        int id = Integer.parseInt(pathParts[2]);
                        deletePaymentTerm(t, id);
                    } else {
                        sendResponse(t, 400, "{\"success\": false, \"message\": \"Payment term ID required\"}");
                    }
                } else {
                    sendResponse(t, 405, "{\"error\": \"Method not allowed\"}");
                }
            } catch (SQLException e) {
                sendResponse(t, 500, "{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
            }
        }

        private void getPaymentTermsByProject(HttpExchange t, int projectId) throws SQLException, IOException {
            String sql = "SELECT * FROM payment_terms WHERE project_id = ? ORDER BY milestone_percentage ASC";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();

            JSONArray terms = new JSONArray();
            while (rs.next()) {
                JSONObject term = new JSONObject();
                term.put("id", rs.getInt("id"));
                term.put("project_id", rs.getInt("project_id"));
                term.put("termin_name", rs.getString("termin_name"));
                term.put("milestone_percentage", rs.getDouble("milestone_percentage"));
                term.put("amount", rs.getDouble("amount"));
                term.put("status", rs.getString("status"));
                term.put("due_date", rs.getString("due_date"));
                term.put("paid_date", rs.getString("paid_date"));
                term.put("notes", rs.getString("notes"));
                terms.put(term);
            }

            JSONObject response = new JSONObject();
            response.put("success", true);
            response.put("count", terms.length());
            response.put("data", terms);

            sendResponse(t, 200, response.toString());
        }

        private void createPaymentTerm(HttpExchange t) throws SQLException, IOException {
            String body = readRequestBody(t);
            JSONObject json = new JSONObject(body);

            String sql = "INSERT INTO payment_terms (project_id, termin_name, milestone_percentage, amount, status, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = dbConnection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            stmt.setInt(1, json.getInt("project_id"));
            stmt.setString(2, json.getString("termin_name"));
            stmt.setDouble(3, json.getDouble("milestone_percentage"));
            stmt.setDouble(4, json.getDouble("amount"));
            stmt.setString(5, json.optString("status", "Unpaid"));
            stmt.setString(6, json.optString("due_date", null));
            stmt.setString(7, json.optString("notes", ""));

            stmt.executeUpdate();
            ResultSet rs = stmt.getGeneratedKeys();
            int id = 0;
            if (rs.next()) {
                id = rs.getInt(1);
            }

            JSONObject response = new JSONObject();
            response.put("success", true);
            response.put("message", "Payment term created successfully");
            response.put("id", id);

            sendResponse(t, 201, response.toString());
        }

        private void updatePaymentTerm(HttpExchange t, int id) throws SQLException, IOException {
            String body = readRequestBody(t);
            JSONObject json = new JSONObject(body);

            String sql = "UPDATE payment_terms SET termin_name = ?, milestone_percentage = ?, amount = ?, status = ?, due_date = ?, paid_date = ?, notes = ? WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setString(1, json.optString("termin_name"));
            stmt.setDouble(2, json.optDouble("milestone_percentage"));
            stmt.setDouble(3, json.optDouble("amount"));
            stmt.setString(4, json.optString("status"));
            stmt.setString(5, json.optString("due_date", null));
            stmt.setString(6, json.optString("paid_date", null));
            stmt.setString(7, json.optString("notes", ""));
            stmt.setInt(8, id);

            int affected = stmt.executeUpdate();

            JSONObject response = new JSONObject();
            if (affected > 0) {
                response.put("success", true);
                response.put("message", "Payment term updated successfully");
            } else {
                response.put("success", false);
                response.put("message", "Payment term not found");
            }

            sendResponse(t, 200, response.toString());
        }

        private void confirmPayment(HttpExchange t, int id) throws SQLException, IOException {
            // Consume request body even if not used
            readRequestBody(t);

            // Update status to Paid and set paid_date to today
            String sql = "UPDATE payment_terms SET status = 'Paid', paid_date = CURDATE() WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setInt(1, id);

            int affected = stmt.executeUpdate();

            JSONObject response = new JSONObject();
            if (affected > 0) {
                response.put("success", true);
                response.put("message", "Payment confirmed successfully");

                // Fetch updated data to return
                String selectSql = "SELECT * FROM payment_terms WHERE id = ?";
                PreparedStatement selectStmt = dbConnection.prepareStatement(selectSql);
                selectStmt.setInt(1, id);
                ResultSet rs = selectStmt.executeQuery();
                if (rs.next()) {
                    JSONObject data = new JSONObject();
                    data.put("id", rs.getInt("id"));
                    data.put("status", rs.getString("status"));
                    data.put("paid_date", rs.getString("paid_date"));
                    response.put("data", data);
                }
            } else {
                response.put("success", false);
                response.put("message", "Payment term not found");
            }

            sendResponse(t, 200, response.toString());
        }

        private void deletePaymentTerm(HttpExchange t, int id) throws SQLException, IOException {
            String sql = "DELETE FROM payment_terms WHERE id = ?";
            PreparedStatement stmt = dbConnection.prepareStatement(sql);
            stmt.setInt(1, id);

            int affected = stmt.executeUpdate();

            JSONObject response = new JSONObject();
            if (affected > 0) {
                response.put("success", true);
                response.put("message", "Payment term deleted successfully");
            } else {
                response.put("success", false);
                response.put("message", "Payment term not found");
            }

            sendResponse(t, 200, response.toString());
        }
    }

    // =====================================================
    // BUDGET SUMMARY ENDPOINT
    // =====================================================

    static class BudgetSummaryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            enableCORS(t);

            if (t.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                t.sendResponseHeaders(204, -1);
                return;
            }

            String path = t.getRequestURI().getPath();
            String[] pathParts = path.split("/");

            if (pathParts.length < 4) {
                sendResponse(t, 400, "{\"success\": false, \"message\": \"Project ID required\"}");
                return;
            }

            try {
                int projectId = Integer.parseInt(pathParts[3]);

                // Get project budget
                String projectSql = "SELECT budget FROM projects WHERE id = ?";
                PreparedStatement projectStmt = dbConnection.prepareStatement(projectSql);
                projectStmt.setInt(1, projectId);
                ResultSet projectRs = projectStmt.executeQuery();

                double totalBudget = 0;
                if (projectRs.next()) {
                    totalBudget = projectRs.getDouble("budget");
                }

                // Get payment terms summary
                String sql = "SELECT SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as paid, " +
                        "SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending, " +
                        "SUM(CASE WHEN status = 'Unpaid' THEN amount ELSE 0 END) as unpaid " +
                        "FROM payment_terms WHERE project_id = ?";
                PreparedStatement stmt = dbConnection.prepareStatement(sql);
                stmt.setInt(1, projectId);
                ResultSet rs = stmt.executeQuery();

                double paidAmount = 0;
                double pendingAmount = 0;
                double unpaidAmount = 0;

                if (rs.next()) {
                    paidAmount = rs.getDouble("paid");
                    pendingAmount = rs.getDouble("pending");
                    unpaidAmount = rs.getDouble("unpaid");
                }

                double remainingBudget = totalBudget - paidAmount;
                double percentageUsed = totalBudget > 0 ? (paidAmount / totalBudget * 100) : 0;

                JSONObject summary = new JSONObject();
                summary.put("totalContract", totalBudget);
                summary.put("paidAmount", paidAmount);
                summary.put("pendingAmount", pendingAmount);
                summary.put("unpaidAmount", unpaidAmount);
                summary.put("remainingBudget", remainingBudget);
                summary.put("percentageUsed", percentageUsed);

                JSONObject response = new JSONObject();
                response.put("success", true);
                response.put("data", summary);

                sendResponse(t, 200, response.toString());

            } catch (SQLException e) {
                sendResponse(t, 500, "{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    // =====================================================
    // MILESTONE PROCESSOR (for EAI integration)
    // =====================================================

    static class MilestoneHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            enableCORS(t);

            if (t.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                t.sendResponseHeaders(204, -1);
                return;
            }

            try {
                String body = readRequestBody(t);
                JSONObject json = new JSONObject(body);
                int projectId = json.getInt("project_id");
                double progress = json.getDouble("progress");

                System.out.println("Processing milestone event - Project: " + projectId + ", Progress: " + progress);

                // Check if any payment terms should be triggered
                String sql = "SELECT * FROM payment_terms WHERE project_id = ? AND milestone_percentage <= ? AND status = 'Unpaid' ORDER BY milestone_percentage ASC";
                PreparedStatement stmt = dbConnection.prepareStatement(sql);
                stmt.setInt(1, projectId);
                stmt.setDouble(2, progress);
                ResultSet rs = stmt.executeQuery();

                int triggered = 0;
                while (rs.next()) {
                    int termId = rs.getInt("id");
                    String terminName = rs.getString("termin_name");

                    // Update status to Pending (ready to pay)
                    String updateSql = "UPDATE payment_terms SET status = 'Pending' WHERE id = ?";
                    PreparedStatement updateStmt = dbConnection.prepareStatement(updateSql);
                    updateStmt.setInt(1, termId);
                    updateStmt.executeUpdate();

                    triggered++;
                    System.out.println("✓ Payment term '" + terminName + "' triggered (milestone "
                            + rs.getDouble("milestone_percentage") + "% reached)");
                }

                JSONObject response = new JSONObject();
                response.put("success", true);
                response.put("message", "Milestone processed, " + triggered + " payment(s) triggered");
                response.put("triggered_count", triggered);

                sendResponse(t, 200, response.toString());

            } catch (SQLException e) {
                sendResponse(t, 500, "{\"success\": false, \"message\": \"" + e.getMessage() + "\"}");
            }
        }
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    private static void enableCORS(HttpExchange t) {
        t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        t.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        t.getResponseHeaders().add("Access-Control-Allow-Headers",
                "Content-Type, Authorization, x-user-id, x-user-email, x-user-role");
        t.getResponseHeaders().add("Access-Control-Max-Age", "86400");
    }

    private static void sendResponse(HttpExchange t, int statusCode, String response) throws IOException {
        t.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        t.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = t.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String readRequestBody(HttpExchange t) throws IOException {
        InputStreamReader isr = new InputStreamReader(t.getRequestBody(), StandardCharsets.UTF_8);
        BufferedReader br = new BufferedReader(isr);
        StringBuilder requestBody = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            requestBody.append(line);
        }
        return requestBody.toString();
    }
}
