package com.flixermedia.flixer.tv;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "FlixerTv")
public class FlixerTvPlugin extends Plugin {
    private static final long QUICK_SETUP_LIFETIME_MS = 5 * 60 * 1000;
    private static final int MAX_REQUEST_LINE_LENGTH = 8192;
    private static final int MAX_HEADER_BYTES = 16384;
    private static final int MAX_HEADER_COUNT = 32;
    private static final int QUICK_SETUP_TOKEN_BYTES = 32;
    private final Object quickSetupLock = new Object();
    private final SecureRandom secureRandom = new SecureRandom();
    private ServerSocket quickSetupServer;
    private String quickSetupToken;

    @PluginMethod
    public void identify(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void startQuickSetup(PluginCall call) {
        stopQuickSetupServer();
        ServerSocket server = null;
        try {
            String address = getPrivateIpv4Address();
            if (address == null) {
                call.reject("Connect the TV to a private Wi-Fi or Ethernet network before using phone setup.");
                return;
            }

            server = new ServerSocket();
            server.setReuseAddress(false);
            server.setSoTimeout(1000);
            server.bind(new InetSocketAddress(0), 1);

            byte[] tokenBytes = new byte[QUICK_SETUP_TOKEN_BYTES];
            secureRandom.nextBytes(tokenBytes);
            String token = Base64.encodeToString(tokenBytes, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
            long expiresAt = System.currentTimeMillis() + QUICK_SETUP_LIFETIME_MS;
            synchronized (quickSetupLock) {
                quickSetupServer = server;
                quickSetupToken = token;
            }

            ServerSocket activeServer = server;
            Thread listener = new Thread(() -> listenForQuickSetup(activeServer, token, expiresAt), "FlixerTvQuickSetup");
            listener.setDaemon(true);
            listener.start();

            JSObject result = new JSObject();
            result.put("pairingUrl", "http://" + address + ":" + server.getLocalPort() + "/pair?token=" + token);
            result.put("expiresAt", expiresAt);
            call.resolve(result);
        } catch (Exception error) {
            if (server != null) {
                stopQuickSetupServer(server);
                closeServer(server);
            }
            android.util.Log.e("FlixerTv", "Could not start phone setup", error);
            call.reject("Could not start phone setup on this TV.", error);
        }
    }

    @PluginMethod
    public void stopQuickSetup(PluginCall call) {
        stopQuickSetupServer();
        call.resolve();
    }

    private void listenForQuickSetup(ServerSocket server, String token, long expiresAt) {
        try {
            while (System.currentTimeMillis() < expiresAt && !server.isClosed()) {
                synchronized (quickSetupLock) {
                    if (quickSetupServer != server || quickSetupToken == null) return;
                }

                try (Socket client = server.accept()) {
                    client.setSoTimeout(2000);
                    if (handleQuickSetupRequest(client, server, token, expiresAt)) return;
                } catch (java.net.SocketTimeoutException ignored) {
                    // Recheck the expiry and active server.
                } catch (IOException error) {
                    if (!server.isClosed()) android.util.Log.w("FlixerTv", "Phone setup request failed", error);
                }
            }
        } finally {
            stopQuickSetupServer(server);
        }
    }

    private boolean handleQuickSetupRequest(Socket client, ServerSocket server, String expectedToken, long expiresAt) throws IOException {
        InputStream input = client.getInputStream();
        String requestLine = readBoundedLine(input, MAX_REQUEST_LINE_LENGTH);
        if (requestLine == null) return false;
        String[] parts = requestLine.split(" ", 3);
        if (parts.length != 3 || !"POST".equals(parts[0])) {
            writeTextResponse(client.getOutputStream(), "405 Method Not Allowed", "Submit setup from the Flixer phone setup page.");
            return false;
        }

        int headerBytes = requestLine.length();
        boolean headersComplete = false;
        Map<String, String> headers = new HashMap<>();
        for (int count = 0; count < MAX_HEADER_COUNT; count++) {
            String header = readBoundedLine(input, MAX_REQUEST_LINE_LENGTH);
            if (header == null) return false;
            headerBytes += header.length();
            if (headerBytes > MAX_HEADER_BYTES) {
                writeTextResponse(client.getOutputStream(), "431 Request Header Fields Too Large", "The setup request is too large.");
                return false;
            }
            if (header.isEmpty()) {
                headersComplete = true;
                break;
            }
            int separator = header.indexOf(':');
            if (separator <= 0) continue;
            String name = header.substring(0, separator).trim().toLowerCase(java.util.Locale.ROOT);
            String value = header.substring(separator + 1).trim();
            if (headers.putIfAbsent(name, value) != null && ("content-length".equals(name) || "content-type".equals(name))) {
                writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
                return false;
            }
        }
        if (!headersComplete) {
            writeTextResponse(client.getOutputStream(), "431 Request Header Fields Too Large", "The setup request has too many headers.");
            return false;
        }

        URI requestUri;
        try {
            requestUri = URI.create(parts[1]);
        } catch (IllegalArgumentException error) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
            return false;
        }
        if (!"/pair".equals(requestUri.getPath())) {
            writeTextResponse(client.getOutputStream(), "404 Not Found", "This TV setup link is no longer available.");
            return false;
        }

        Map<String, String> queryParameters;
        try {
            queryParameters = parseQuery(requestUri.getRawQuery());
        } catch (IllegalArgumentException error) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
            return false;
        }
        int contentLength;
        try {
            contentLength = Integer.parseInt(headers.get("content-length"));
        } catch (NumberFormatException | NullPointerException error) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
            return false;
        }
        String contentType = headers.get("content-type");
        String mediaType = contentType == null ? "" : contentType.split(";", 2)[0].trim();
        if (
            queryParameters.size() != 1
            || queryParameters.get("token") == null
            || contentLength < 1
            || contentLength > 8192
            || headers.containsKey("transfer-encoding")
            || !"application/x-www-form-urlencoded".equalsIgnoreCase(mediaType)
        ) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
            return false;
        }

        byte[] body = new byte[contentLength];
        int bodyBytesRead = 0;
        while (bodyBytesRead < body.length) {
            int count = input.read(body, bodyBytesRead, body.length - bodyBytesRead);
            if (count < 0) {
                writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is incomplete.");
                return false;
            }
            bodyBytesRead += count;
        }
        Map<String, String> bodyParameters;
        try {
            bodyParameters = parseQuery(new String(body, StandardCharsets.UTF_8));
        } catch (IllegalArgumentException error) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "The setup request is invalid.");
            return false;
        }
        String submittedToken = queryParameters.get("token");
        String serverUrl = normalizeServerUrl(bodyParameters.get("server"));
        if (bodyParameters.size() != 1 || serverUrl == null) {
            writeTextResponse(client.getOutputStream(), "400 Bad Request", "Open /quick-setup on your phone and scan the TV code.");
            return false;
        }

        synchronized (quickSetupLock) {
            if (
                quickSetupServer != server
                || quickSetupToken == null
                || System.currentTimeMillis() >= expiresAt
                || !MessageDigest.isEqual(expectedToken.getBytes(StandardCharsets.UTF_8), submittedToken.getBytes(StandardCharsets.UTF_8))
            ) {
                writeTextResponse(client.getOutputStream(), "410 Gone", "This TV setup code has expired. Create a new code on the TV.");
                return false;
            }
            quickSetupToken = null;
        }

        JSObject result = new JSObject();
        result.put("serverUrl", serverUrl);
        notifyListeners("quickSetupReceived", result);
        writeRedirectResponse(client.getOutputStream(), serverUrl + "/quick-setup?paired=1");
        return true;
    }

    private String readBoundedLine(InputStream input, int maximumLength) throws IOException {
        ByteArrayOutputStream line = new ByteArrayOutputStream();
        int value;
        while ((value = input.read()) != -1) {
            if (value == '\n') break;
            if (value != '\r') {
                line.write(value);
                if (line.size() > maximumLength) throw new IOException("HTTP line exceeds the size limit.");
            }
        }
        if (value == -1 && line.size() == 0) return null;
        return new String(line.toByteArray(), StandardCharsets.US_ASCII);
    }

    private Map<String, String> parseQuery(String query) throws IOException {
        Map<String, String> parameters = new HashMap<>();
        if (query == null || query.isEmpty()) return parameters;
        for (String part : query.split("&")) {
            int separator = part.indexOf('=');
            if (separator <= 0) throw new IllegalArgumentException("Invalid query parameter.");
            String key = URLDecoder.decode(part.substring(0, separator), "UTF-8");
            String value = URLDecoder.decode(part.substring(separator + 1), "UTF-8");
            if (parameters.putIfAbsent(key, value) != null) throw new IllegalArgumentException("Duplicate query parameter.");
        }
        return parameters;
    }

    private String normalizeServerUrl(String value) {
        if (value == null || value.length() > 2048) return null;
        try {
            URI uri = URI.create(value);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null) {
                return null;
            }
            String path = uri.getRawPath() == null ? "" : uri.getRawPath().replaceAll("/+$", "");
            if (path.endsWith("/api")) path = path.substring(0, path.length() - 4);
            String authority = uri.getRawAuthority();
            return "https://" + authority + path;
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private String getPrivateIpv4Address() throws SocketException {
        Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
        String fallbackAddress = null;
        while (interfaces != null && interfaces.hasMoreElements()) {
            NetworkInterface network = interfaces.nextElement();
            if (!network.isUp() || network.isLoopback()) continue;
            Enumeration<InetAddress> addresses = network.getInetAddresses();
            while (addresses.hasMoreElements()) {
                InetAddress address = addresses.nextElement();
                if (address instanceof Inet4Address && address.isSiteLocalAddress()) {
                    String value = address.getHostAddress();
                    if ("wlan0".equalsIgnoreCase(network.getName())) return value;
                    if (fallbackAddress == null) fallbackAddress = value;
                }
            }
        }
        return fallbackAddress;
    }

    private void writeTextResponse(OutputStream output, String status, String message) throws IOException {
        byte[] body = message.getBytes(StandardCharsets.UTF_8);
        String headers = "HTTP/1.1 " + status + "\r\n"
            + "Content-Type: text/plain; charset=utf-8\r\n"
            + "Cache-Control: no-store\r\n"
            + "Connection: close\r\n"
            + "Content-Length: " + body.length + "\r\n\r\n";
        output.write(headers.getBytes(StandardCharsets.US_ASCII));
        output.write(body);
        output.flush();
    }

    private void writeRedirectResponse(OutputStream output, String location) throws IOException {
        String headers = "HTTP/1.1 303 See Other\r\n"
            + "Location: " + location + "\r\n"
            + "Cache-Control: no-store\r\n"
            + "Connection: close\r\n"
            + "Content-Length: 0\r\n\r\n";
        output.write(headers.getBytes(StandardCharsets.US_ASCII));
        output.flush();
    }

    private void stopQuickSetupServer() {
        ServerSocket server;
        synchronized (quickSetupLock) {
            server = quickSetupServer;
            quickSetupServer = null;
            quickSetupToken = null;
        }
        closeServer(server);
    }

    private void stopQuickSetupServer(ServerSocket expectedServer) {
        boolean shouldClose = false;
        synchronized (quickSetupLock) {
            if (quickSetupServer == expectedServer) {
                quickSetupServer = null;
                quickSetupToken = null;
                shouldClose = true;
            }
        }
        if (shouldClose) closeServer(expectedServer);
    }

    private void closeServer(ServerSocket server) {
        if (server == null || server.isClosed()) return;
        try {
            server.close();
        } catch (IOException error) {
            android.util.Log.w("FlixerTv", "Could not close phone setup listener", error);
        }
    }
}