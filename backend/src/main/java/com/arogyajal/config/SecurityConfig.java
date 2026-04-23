package com.arogyajal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // Let the CorsConfig handle CORS
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/**").permitAll() // Allow all requests
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable()) // Disable CSRF for all endpoints
            .headers(headers -> headers
                .frameOptions(frame -> frame.sameOrigin())
            )
            .addFilterAfter((request, response, chain) -> {
                // Wrap the request to allow multiple reads of the body
                org.springframework.web.util.ContentCachingRequestWrapper wrappedRequest = 
                    new org.springframework.web.util.ContentCachingRequestWrapper((jakarta.servlet.http.HttpServletRequest) request);
                
                // Log incoming requests for debugging
                System.out.println("\n=== Incoming Request ===");
                System.out.println("Method: " + wrappedRequest.getMethod());
                System.out.println("URL: " + wrappedRequest.getRequestURL());
                
                // Log headers
                java.util.Enumeration<String> headerNames = wrappedRequest.getHeaderNames();
                System.out.println("Headers:");
                while (headerNames.hasMoreElements()) {
                    String header = headerNames.nextElement();
                    System.out.println("  " + header + ": " + wrappedRequest.getHeader(header));
                }
                
                // For POST requests, log the body
                if ("POST".equalsIgnoreCase(wrappedRequest.getMethod())) {
                    // Read the body into the wrapper
                    try {
                        wrappedRequest.getParameterMap(); // This reads the body into the wrapper
                        String body = new String(wrappedRequest.getContentAsByteArray(), 
                                              wrappedRequest.getCharacterEncoding());
                        if (!body.isEmpty()) {
                            System.out.println("Request Body: " + body);
                        }
                    } catch (Exception e) {
                        System.err.println("Error reading request body: " + e.getMessage());
                    }
                }
                
                // Continue with the wrapped request
                chain.doFilter(wrappedRequest, response);
                
                // Log response status
                jakarta.servlet.http.HttpServletResponse httpResponse = (jakarta.servlet.http.HttpServletResponse) response;
                System.out.println("Response Status: " + httpResponse.getStatus());
                System.out.println("========================\n");
            }, org.springframework.security.web.csrf.CsrfFilter.class);
            
        return http.build();
    }
    
    // CORS configuration is handled by CorsConfig.java
}
