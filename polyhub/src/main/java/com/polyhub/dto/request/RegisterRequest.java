package com.polyhub.dto.request;

<<<<<<< HEAD
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private String fullName;
    private String email;
}
=======
import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String confirmPassword;
    private String fullname;
    private String email;
}
>>>>>>> b97c3c267eb6d6ba53fb865b3901f4c020c4057e
