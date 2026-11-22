package com.loginanalysis.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loginanalysis.config.GrokConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GrokClient {

    private final GrokConfig grokConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public boolean isAvailable() {
        return grokConfig.isConfigured();
    }

    /**
     * Executes a chat completion request to the official xAI Grok API.
     *
     * @param systemPrompt Instructions defining the persona, output schema and safety boundaries.
     * @param userPrompt The sanitized analytical payload and context.
     * @return Content text returned by Grok.
     * @throws Exception If external API call fails, times out, or returns a non-2xx status code.
     */
    public String chatCompletion(String systemPrompt, String userPrompt) throws Exception {
        if (!isAvailable()) {
            throw new IllegalStateException("xAI Grok API key is not configured or placeholder detected.");
        }

        Map<String, Object> requestPayload = new LinkedHashMap<>();
        requestPayload.put("model", grokConfig.getEffectiveModel());
        requestPayload.put("temperature", 0.2);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        requestPayload.put("messages", messages);

        String jsonBody = objectMapper.writeValueAsString(requestPayload);
        String endpoint = grokConfig.getBaseUrl().replaceAll("/+$", "") + "/chat/completions";

        log.info("Sending AI analysis request to xAI Grok endpoint [{}] with model [{}]",
                endpoint, grokConfig.getEffectiveModel());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + grokConfig.getApiKey().trim())
                .timeout(Duration.ofSeconds(grokConfig.getTimeoutSeconds()))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status >= 200 && status < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    JsonNode messageNode = choices.get(0).path("message");
                    String content = messageNode.path("content").asText();
                    return content;
                }
                return response.body();
            } else if (status == 401) {
                log.error("xAI Grok Authentication failed (HTTP 401). Please check XAI_API_KEY.");
                throw new RuntimeException("xAI Grok API authentication failed: Invalid or expired API key.");
            } else if (status == 429) {
                log.warn("xAI Grok rate limit reached (HTTP 429).");
                throw new RuntimeException("xAI Grok rate limit exceeded. Please retry shortly.");
            } else {
                log.error("xAI Grok API returned HTTP {}: {}", status, response.body());
                throw new RuntimeException("xAI Grok API error (HTTP " + status + "): " + response.body());
            }
        } catch (HttpTimeoutException te) {
            log.error("xAI Grok API request timed out after {} seconds: {}", grokConfig.getTimeoutSeconds(), te.getMessage());
            throw new RuntimeException("xAI Grok API request timed out. Fallback engaged.");
        } catch (Exception e) {
            log.error("xAI Grok API communication error: {}", e.getMessage());
            throw e;
        }
    }
}
