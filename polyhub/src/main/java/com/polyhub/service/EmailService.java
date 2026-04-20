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

    @Async
    public void sendMentorRevokeEmail(String toEmail, String fullname, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Thông báo: Quyền Mentor của bạn đã bị thu hồi");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #e02424; text-align: center;\">Thu Hồi Quyền Mentor</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Chúng tôi rất lấy làm tiếc phải thông báo rằng quyền Mentor của bạn trên hệ thống PolyHUB vừa bị <strong>thu hồi (tước quyền)</strong>. Tài khoản của bạn đã được chuyển về mức quyền Sinh viên mặc định.</p>"
                    + "<p>Quyết định này được đưa ra sau khi Ban quản trị đánh giá, với lý do cụ thể như sau:</p>"
                    + "<div style=\"background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0; color: #991b1b;\">"
                    +   "<em>\"" + reason + "\"</em>"
                    + "</div>"
                    + "<p>Nếu bạn có thắc mắc hoặc cần khiếu nại, vui lòng liên hệ trực tiếp với bộ phận chăm sóc để được giải đáp.</p>"
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
    public void sendOTPEmail(String toEmail, String fullname, String otpCode) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Yêu cầu Cấp lại Mật khẩu");
            String htmlContent = "<div style=\"font-family: Inter, Arial, sans-serif; padding: 20px; background-color: #f3f4f6;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-top: 5px solid #f27125;\">"
                    + "<div style=\"text-align: center; margin-bottom: 30px;\">"
                    + "<h1 style=\"color: #111827; margin: 0; font-size: 24px;\">Quên Mật Khẩu?</h1>"
                    + "</div>"
                    + "<p style=\"color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 20px;\">Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p style=\"color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;\">Chúng tôi nhận được yêu cầu cấp lại mật khẩu cho tài khoản liên kết với email này. Để tiếp tục, vui lòng sử dụng mã xác thực (OTP) có hiệu lực trong 5 phút dưới đây:</p>"
                    + "<div style=\"background-color: #fef3c7; border: 2px dashed #f59e0b; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 30px;\">"
                    + "<span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #b45309;\">" + otpCode + "</span>"
                    + "</div>"
                    + "<p style=\"color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 0;\">Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Không chia sẻ mã OTP với bất kỳ ai để đảm bảo an toàn cho tài khoản.</p>"
                    + "<hr style=\"border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;\"/>"
                    + "<p style=\"text-align: center; color: #9ca3af; font-size: 13px; margin: 0;\">Hệ thống PolyHUB &copy; 2026</p>"
                    + "</div></div>";
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (jakarta.mail.MessagingException e) {
            System.err.println("Lỗi gửi OTP Email: " + e.getMessage());
        }
    }
    public void sendAccountLockEmail(String toEmail, String fullname, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Thông báo: Tài khoản của bạn đã bị khóa");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #e02424; text-align: center;\">Tài Khoản Bị Khóa</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Chúng tôi rất lấy làm tiếc phải thông báo rằng tài khoản của bạn trên hệ thống PolyHUB đã bị <strong>khóa</strong>.</p>"
                    + "<p>Lý do cụ thể như sau:</p>"
                    + "<div style=\"background-color: #fef2f2; border-left: 4px solid #f87171; padding: 15px; margin: 20px 0; color: #991b1b;\">"
                    +   "<em>\"" + reason + "\"</em>"
                    + "</div>"
                    + "<p>Nếu bạn có thắc mắc hoặc cần khiếu nại, vui lòng liên hệ trực tiếp với bộ phận chăm sóc để được giải đáp.</p>"
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
    public void sendAccountUnlockEmail(String toEmail, String fullname) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Thông báo: Tài khoản của bạn đã được mở khóa");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #057A55; text-align: center;\">Tài Khoản Được Mở Khóa</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Tài khoản của bạn trên hệ thống PolyHUB vừa được Ban quản trị <strong>mở khóa</strong> thành công.</p>"
                    + "<p>Bạn có thể tiếp tục truy cập và sử dụng dịch vụ của chúng tôi.</p>"
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
    public void sendRoleAssignmentEmail(String toEmail, String fullname, String roleName) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("PolyHUB - Thông báo: Cập nhật quyền hạn tài khoản");

            String htmlContent = "<div style=\"font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;\">"
                    + "<div style=\"max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + "<h2 style=\"color: #057A55; text-align: center;\">Cập Nhật Quyền Hạn</h2>"
                    + "<p>Chào <strong>" + fullname + "</strong>,</p>"
                    + "<p>Tài khoản của bạn trên hệ thống PolyHUB vừa được cập nhật vai trò mới.</p>"
                    + "<p>Vai trò hiện tại của bạn là: <strong style=\"color: #EE0979;\">" + roleName + "</strong></p>"
                    + "<p>Hãy đăng nhập lại vào hệ thống để trải nghiệm các chức năng tương ứng với quyền hạn mới của bạn.</p>"
                    + "<hr style=\"border-top:1px solid #eee; margin: 30px 0;\"/>"
                    + "<p style=\"text-align: center; color: #888; font-size: 13px;\">Hệ thống PolyHUB &copy; 2026</p>"
                    + "</div></div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);

        } catch (jakarta.mail.MessagingException e) {
            System.err.println("Lỗi gửi Email: " + e.getMessage());
        }
    }
}
