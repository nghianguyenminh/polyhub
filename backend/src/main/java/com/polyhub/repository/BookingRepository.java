package com.polyhub.repository;

import com.polyhub.entity.Booking;
import com.polyhub.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByStudentUsernameOrderByBookingDateDescStartTimeDesc(String username);
    List<Booking> findByMentorUsernameOrderByBookingDateDescStartTimeDesc(String username);
    List<Booking> findByStatusIn(List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.mentor.username = :mentorUsername " +
           "AND b.bookingDate = :date AND b.status IN :statuses")
    List<Booking> findBookingsByMentorAndDate(
            @Param("mentorUsername") String mentorUsername, 
            @Param("date") LocalDate date, 
            @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b WHERE b.student.username = :studentUsername " +
           "AND b.bookingDate = :date AND b.status IN :statuses")
    List<Booking> findBookingsByStudentAndDate(
            @Param("studentUsername") String studentUsername, 
            @Param("date") LocalDate date, 
            @Param("statuses") List<BookingStatus> statuses);
}
