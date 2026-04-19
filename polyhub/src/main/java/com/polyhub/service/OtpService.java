package com.polyhub.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    
    // Store OTP information mapped by email
    private final Map<String, OtpDetails> otpStorage = new ConcurrentHashMap<>();
    private static final long OTP_VALID_DURATION = 5 * 60 * 1000; // 5 minutes

    public void generateAndStoreOtp(String email, String otpCode) {
        OtpDetails details = new OtpDetails(otpCode, System.currentTimeMillis() + OTP_VALID_DURATION);
        otpStorage.put(email, details);
    }

    public boolean validateOtp(String email, String otpCode) {
        OtpDetails details = otpStorage.get(email);
        if (details == null) {
            return false;
        }
        
        if (System.currentTimeMillis() > details.expiryTime) {
            otpStorage.remove(email);
            return false; // OTP expired
        }
        
        return details.otpCode.equals(otpCode);
    }

    public void clearOtp(String email) {
        otpStorage.remove(email);
    }

    private static class OtpDetails {
        String otpCode;
        long expiryTime;

        OtpDetails(String otpCode, long expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
        }
    }
}
