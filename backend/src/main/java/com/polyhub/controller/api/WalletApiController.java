package com.polyhub.controller.api;

import com.polyhub.entity.User;
import com.polyhub.entity.Transaction;
import com.polyhub.repository.UserRepository;
import com.polyhub.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api/wallet")
public class WalletApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không tồn tại"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("balance", user.getBalance() != null ? user.getBalance() : 0L);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/withdraw")
    @Transactional
    public ResponseEntity<?> withdraw(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        }

        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Người dùng không tồn tại"));
        }

        if (user.getRole() == null || !"MENTOR".equalsIgnoreCase(user.getRole().getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Chỉ Mentor mới có thể rút tiền"));
        }

        Long amount = 0L;
        try {
            amount = Long.parseLong(payload.get("amount").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số tiền không hợp lệ"));
        }

        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số tiền rút phải lớn hơn 0"));
        }

        Long currentBalance = user.getBalance() != null ? user.getBalance() : 0L;
        if (currentBalance < amount) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số dư không đủ"));
        }

        // Tính thuế 10%
        long tax = (long) (amount * 0.10);
        long netAmount = amount - tax;

        // Trừ tiền
        user.setBalance(currentBalance - amount);
        userRepository.save(user);

        // Lưu lịch sử giao dịch
        Transaction tx = Transaction.builder()
                .username(user.getUsername())
                .amount(amount)
                .type("WITHDRAW")
                .status("SUCCESS")
                .txCode("WD" + System.currentTimeMillis())
                .build();
        transactionRepository.save(tx);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Rút tiền thành công");
        response.put("withdrawnAmount", amount);
        response.put("tax", tax);
        response.put("netAmount", netAmount);
        response.put("remainingBalance", user.getBalance());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-add")
    @Transactional
    public ResponseEntity<?> addTestMoney(@RequestParam(required = false, defaultValue = "TC00523") String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
            long current = user.getBalance() != null ? user.getBalance() : 0L;
            user.setBalance(current + 100000L);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Đã cộng 100k vào tài khoản " + username, "newBalance", user.getBalance()));
        }
        return ResponseEntity.badRequest().body("Not found user " + username);
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        List<Transaction> transactions = transactionRepository.findByUsernameOrderByCreatedAtDesc(principal.getName());
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/deposit")
    @Transactional
    public ResponseEntity<?> createDeposit(@RequestBody Map<String, Object> payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        Long amount = 0L;
        try {
            amount = Long.parseLong(payload.get("amount").toString());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Số tiền không hợp lệ"));
        }
        if (amount < 10000) return ResponseEntity.badRequest().body(Map.of("error", "Số tiền nạp tối thiểu là 10.000 VNĐ"));

        String txCode = "NAP" + System.currentTimeMillis();
        Transaction tx = Transaction.builder()
                .username(principal.getName())
                .amount(amount)
                .type("DEPOSIT")
                .status("PENDING")
                .txCode(txCode)
                .build();
        transactionRepository.save(tx);
        
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/deposit/{id}/confirm")
    @Transactional
    public ResponseEntity<?> confirmDepositMock(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Chưa đăng nhập"));
        
        Transaction tx = transactionRepository.findById(id).orElse(null);
        if (tx == null || !tx.getUsername().equals(principal.getName())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không tìm thấy giao dịch"));
        }
        if (!"PENDING".equals(tx.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giao dịch đã được xử lý"));
        }
        
        User user = userRepository.findById(principal.getName()).orElse(null);
        if (user != null) {
            long current = user.getBalance() != null ? user.getBalance() : 0L;
            user.setBalance(current + tx.getAmount());
            userRepository.save(user);
        }
        
        tx.setStatus("SUCCESS");
        transactionRepository.save(tx);
        
        return ResponseEntity.ok(Map.of("message", "Xác nhận nạp tiền thành công", "newBalance", user != null ? user.getBalance() : 0));
    }
}
