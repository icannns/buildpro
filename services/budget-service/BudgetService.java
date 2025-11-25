import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class BudgetService {
    private static final int PORT = 5004;
    private static final String DATA_FILE = "payments.json";

    public static void main(String[] args) throws IOException {
        // Initialize data file if not exists
        if (!Files.exists(Paths.get(DATA_FILE))) {
            Files.write(Paths.get(DATA_FILE), "[]".getBytes());
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // Define endpoints
        server.createContext("/", new RootHandler());
        server.createContext("/payments", new PaymentsHandler());
        server.createContext("/payments/process-milestone", new MilestoneHandler());

        server.setExecutor(null); // creates a default executor
        System.out.println("Budget Service (Java) running on port " + PORT);
        server.start();
    }

    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = "{\"service\": \"Budget Service\", \"language\": \"Java\", \"status\": \"Active\"}";
            sendResponse(t, 200, response);
        }
    }

    static class PaymentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            // Set CORS headers
            t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            t.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            t.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if (t.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                t.sendResponseHeaders(204, -1);
                return;
            }

            if (t.getRequestMethod().equalsIgnoreCase("GET")) {
                // Read payments from file
                String content = new String(Files.readAllBytes(Paths.get(DATA_FILE)));

                // Calculate summary from payments data
                double totalContract = 0;
                double paidAmount = 0;
                double pendingAmount = 0;
                double unpaidAmount = 0;

                // Parse the JSON array manually (very basic)
                if (!content.trim().equals("[]")) {
                    String[] payments = content.split("\\},");
                    for (String payment : payments) {
                        // Extract amount
                        int amountIndex = payment.indexOf("\"amount\":");
                        if (amountIndex != -1) {
                            String amountStr = payment.substring(amountIndex + 9).trim();
                            int commaOrBrace = amountStr.indexOf(",");
                            if (commaOrBrace == -1)
                                commaOrBrace = amountStr.indexOf("}");
                            if (commaOrBrace > 0) {
                                amountStr = amountStr.substring(0, commaOrBrace).trim();
                                double amount = Double.parseDouble(amountStr);
                                totalContract += amount;

                                // Extract status
                                int statusIndex = payment.indexOf("\"status\":");
                                if (statusIndex != -1) {
                                    String statusStr = payment.substring(statusIndex + 9).trim();
                                    if (statusStr.contains("\"Paid\"")) {
                                        paidAmount += amount;
                                    } else if (statusStr.contains("\"Pending\"")) {
                                        pendingAmount += amount;
                                    } else if (statusStr.contains("\"Unpaid\"")) {
                                        unpaidAmount += amount;
                                    }
                                }
                            }
                        }
                    }
                }

                double remainingBudget = totalContract - paidAmount;
                double percentageUsed = totalContract > 0 ? (paidAmount / totalContract * 100) : 0;

                // Format summary with US locale for proper JSON (decimal point, not comma)
                String summary = String.format(Locale.US,
                        "{\"totalContract\": %.0f, \"paidAmount\": %.0f, \"pendingAmount\": %.0f, \"unpaidAmount\": %.0f, \"remainingBudget\": %.0f, \"percentageUsed\": %.2f}",
                        totalContract, paidAmount, pendingAmount, unpaidAmount, remainingBudget, percentageUsed);

                // Wrap in standard response format with summary
                String response = String.format("{\"success\": true, \"data\": %s, \"summary\": %s}", content, summary);
                sendResponse(t, 200, response);
            } else {
                sendResponse(t, 405, "{\"error\": \"Method not allowed\"}");
            }
        }
    }

    static class MilestoneHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            // Set CORS headers
            t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            t.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            t.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if (t.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                t.sendResponseHeaders(204, -1);
                return;
            }

            if (t.getRequestMethod().equalsIgnoreCase("POST")) {
                InputStreamReader isr = new InputStreamReader(t.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder requestBody = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    requestBody.append(line);
                }

                System.out.println("Received milestone event: " + requestBody.toString());

                // Create new payment
                String newPayment = String.format(Locale.US,
                        "{\"id\": %d, \"project_id\": 1, \"termin_name\": \"Termin Progress\", \"amount\": 50000000, \"status\": \"Pending\", \"date\": \"%s\"}",
                        System.currentTimeMillis(),
                        LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));

                // Read existing, append new payment
                String currentData = new String(Files.readAllBytes(Paths.get(DATA_FILE)));
                String updatedData;

                if (currentData.trim().equals("[]")) {
                    updatedData = "[" + newPayment + "]";
                } else {
                    updatedData = currentData.substring(0, currentData.lastIndexOf("]")) + "," + newPayment + "]";
                }

                Files.write(Paths.get(DATA_FILE), updatedData.getBytes());

                String response = "{\"success\": true, \"message\": \"Payment generated from milestone\"}";
                sendResponse(t, 200, response);
            }
        }
    }

    private static void sendResponse(HttpExchange t, int statusCode, String response) throws IOException {
        t.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        t.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = t.getResponseBody();
        os.write(bytes);
        os.close();
    }
}
