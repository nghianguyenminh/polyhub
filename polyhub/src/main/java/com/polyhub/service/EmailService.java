package com.polyhub.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    /**
     * Gửi email song song để không làm chậm luồng code khi User/Admin dùng chức năng.
     * Sử dụng HTML Mail để trình bày thư đẹp hơn.
     */
    @Async
    public void sendRejectionEmail(String toEmail, String studentName, String documentTitle, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Thông báo: Tài liệu của bạn KHÔNG ĐƯỢC PHÊ DUYỆT");

            // HTML Form Template nhẹ nhàng, sạch sẽ
            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #e02424; text-align: center;\">Tài Liệu Bị Từ Chối</h2>"
                    + "<p>Chào <strong>" + studentName + "</strong>,</p>"
                    + "<p>Cảm ơn bạn đã đóng góp tài liệu: <strong style=\"color:#333;\">" + documentTitle + "</strong> cho thư viện PolyHUB.</p>"
                    + "<p>Rất tiếc, sau khi đội ngũ Quản lý kiểm duyệt, tài liệu của bạn chưa đáp ứng đủ tiêu chuẩn vì lý do sau:</p>"
                    + "<div style=\"background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0; color: #991b1b;\">"
                    +   "<em>\"" + reason + "\"</em>"
                    + "</div>"
                    + "<p>Vui lòng điều chỉnh lại rắc rối của bản chia sẻ thay vì Spam lại nếu chưa khắc phục để tránh tài khoản bị khoá (Ban) bởi hệ thống.</p>"
                    + "<hr style=\"border-top:1px solid #eee; margin: 30px 0;\"/>"
                    + "<p style=\"text-align: center; color: #888; font-size: 13px;\">Hệ thống Chia sẻ Tài Liệu PolyHUB &copy; 2026</p>"
                    + "</div></div>";

            helper.setText(htmlContent, true); // True = Enable HTML

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi gửi Email: " + e.getMessage());
            // Vì chạy nền Async, ko ném exception chết App, chỉ log lỗi ở Console
        }
    }

    @Async
    public void sendMentorRejectionEmail(String toEmail, String fullname, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Yêu cầu đăng ký Mentor bị từ chối");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #e02424; text-align: center;\">Yêu Cầu Mentor Bị Từ Chối</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Cảm ơn bạn đã gửi yêu cầu đăng ký trở thành Mentor trên hệ thống PolyHUB.</p>"
                    + "<p>Rất tiếc, sau khi xem xét hồ sơ, chúng tôi chưa thể phê duyệt yêu cầu của bạn tại thời điểm này vì lý do sau:</p>"
                    + "<div style=\"background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0; color: #991b1b;\">"
                    +   "<em>\"" + reason + "\"</em>"
                    + "</div>"
                    + "<p>Bạn hoàn toàn có thể cải thiện và gửi yêu cầu đăng ký lại sau.</p>"
                    + "<hr style=\"border-top:1px solid #eee; margin: 30px 0;\"/>"
                    + "<p style=\"text-align: center; color: #888; font-size: 13px;\">Hệ thống PolyHUB &copy; 2026</p>"
                    + "</div></div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi gửi Email: " + e.getMessage());
        }
    }

    @Async
    public void sendMentorApprovalEmail(String toEmail, String fullname) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Chúc mừng! Bạn đã trở thành Mentor");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #057A55; text-align: center;\">Xác Nhận Cấp Quyền Mentor</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Hồ sơ đăng ký của bạn đã được ban quản trị PolyHUB xem xét và <strong>phê duyệt thành công!</strong></p>"
                    + "<p>Từ giờ bạn đã chính thức có quyền Mentor. Bạn có thể bắt đầu hỗ trợ các thành viên khác, cũng như tiếp cận các tính năng dành riêng cho trải nghiệm giảng dạy, kết nối của mình.</p>"
                    + "<hr style=\"border-top:1px solid #eee; margin: 30px 0;\"/>"
                    + "<p style=\"text-align: center; color: #888; font-size: 13px;\">Hệ thống PolyHUB &copy; 2026</p>"
                    + "</div></div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Lỗi gửi Email: " + e.getMessage());
        }
    }
}