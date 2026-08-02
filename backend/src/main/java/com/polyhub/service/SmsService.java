package com.polyhub.service;

import org.springframework.stereotype.Service;

@Service
public class SmsService {
    
    public void sendSms(String to, String otp) {
        System.out.println(otp);
    }
}