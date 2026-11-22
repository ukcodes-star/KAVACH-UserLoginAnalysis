package com.loginanalysis.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Setter
public class GrokConfig {

    @Value("${xai.api.key:${grok.api.key:}}")
    private String apiKey;

    @Value("${xai.api.base-url:${grok.api.base-url:https://api.x.ai/v1}}")
    private String baseUrl;

    @Value("${xai.api.model:${grok.api.model:grok-4-fast}}")
    private String model;

    @Value("${xai.api.timeout-seconds:25}")
    private int timeoutSeconds;

    public String getEffectiveModel() {
        if (model == null || model.isBlank()) {
            return "grok-4-fast";
        }
        String clean = model.trim().toLowerCase();
        if (clean.contains("4.1") || clean.contains("fast") || clean.equals("grok-4-fast")) {
            return "grok-4-fast";
        }
        return model.trim();
    }

    public boolean isConfigured() {
        return apiKey != null
                && !apiKey.trim().isEmpty()
                && !apiKey.trim().startsWith("YOUR_")
                && !apiKey.trim().startsWith("your_");
    }
}
