-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: polyhub
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_feedback_loops`
--

DROP TABLE IF EXISTS `ai_feedback_loops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_feedback_loops` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_actual_penalty` double NOT NULL,
  `admin_adjustment_reason` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `ai_proposed_penalty` double NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `mentor_busy_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1lr2xivt1igqbi5tktqtd35ak` (`mentor_busy_id`),
  CONSTRAINT `FK1lr2xivt1igqbi5tktqtd35ak` FOREIGN KEY (`mentor_busy_id`) REFERENCES `mentor_busy_periods` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_feedback_loops`
--

LOCK TABLES `ai_feedback_loops` WRITE;
/*!40000 ALTER TABLE `ai_feedback_loops` DISABLE KEYS */;
INSERT INTO `ai_feedback_loops` VALUES (1,1.5,'thích 2',0,'2026-08-03 02:51:44.632860',1);
/*!40000 ALTER TABLE `ai_feedback_loops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_extensions`
--

DROP TABLE IF EXISTS `booking_extensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_extensions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `additional_minutes` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `booking_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1j83kiodbs00dq9ec4yqw0mfm` (`booking_id`),
  CONSTRAINT `FK1j83kiodbs00dq9ec4yqw0mfm` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_extensions`
--

LOCK TABLES `booking_extensions` WRITE;
/*!40000 ALTER TABLE `booking_extensions` DISABLE KEYS */;
INSERT INTO `booking_extensions` VALUES (1,3,'2026-08-14 07:27:28.026310',21);
/*!40000 ALTER TABLE `booking_extensions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_priorities`
--

DROP TABLE IF EXISTS `booking_priorities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_priorities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `duration` int NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `original_booking_id` bigint DEFAULT NULL,
  `priority_order` bigint NOT NULL,
  `status` enum('ACTIVE','EXPIRED','USED') DEFAULT NULL,
  `mentor_username` varchar(20) NOT NULL,
  `student_username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK61o52pa22kdx69ojuwcf8pu35` (`mentor_username`),
  KEY `FKs10vlsi2d48pgiue065rb02fc` (`student_username`),
  CONSTRAINT `FK61o52pa22kdx69ojuwcf8pu35` FOREIGN KEY (`mentor_username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKs10vlsi2d48pgiue065rb02fc` FOREIGN KEY (`student_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_priorities`
--

LOCK TABLES `booking_priorities` WRITE;
/*!40000 ALTER TABLE `booking_priorities` DISABLE KEYS */;
INSERT INTO `booking_priorities` VALUES (1,'2026-08-14 02:06:46.000325',1,'2026-08-16 02:06:45.993912',18,1786673174062,'ACTIVE','TC00523','TC00524');
/*!40000 ALTER TABLE `booking_priorities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_date` date NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `duration` int NOT NULL,
  `end_time` time NOT NULL,
  `mentor_joined` bit(1) DEFAULT NULL,
  `note` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `rejection_reason` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `room_id` varchar(50) DEFAULT NULL,
  `start_time` time NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('APPROVED','CANCELLED','CLOSED','PENDING','REJECTED') NOT NULL,
  `student_joined` bit(1) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `mentor_username` varchar(20) NOT NULL,
  `student_username` varchar(20) NOT NULL,
  `extended_minutes` int DEFAULT NULL,
  `extension_count` int DEFAULT NULL,
  `max_extensions` int DEFAULT NULL,
  `cost` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FKofybh21ngkbesm74fbk4empg6` (`mentor_username`),
  KEY `FKhiv5vdnuigx2pmijtvot2yjmm` (`student_username`),
  CONSTRAINT `FKhiv5vdnuigx2pmijtvot2yjmm` FOREIGN KEY (`student_username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKofybh21ngkbesm74fbk4empg6` FOREIGN KEY (`mentor_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'2026-06-20','2026-06-20 02:00:23.561455',1,'09:06:00',_binary '\0','hhh\n','xin lỗi nay tôi bận \n',NULL,'09:05:00',NULL,'REJECTED',_binary '\0','2026-06-20 02:01:04.211799','TC00523','TC00524',NULL,NULL,NULL,0),(2,'2026-06-20','2026-06-20 02:08:28.538030',30,'09:39:00',_binary '','ffff',NULL,'booking_2','09:09:00','2026-06-20 02:09:10.629215','CANCELLED',_binary '','2026-06-20 02:10:33.689989','TC00523','TC00524',NULL,NULL,NULL,0),(3,'2026-06-20','2026-06-20 02:11:27.487624',30,'09:42:00',_binary '\0','dd',NULL,'booking_3','09:12:00',NULL,'CANCELLED',_binary '\0','2026-06-20 02:11:52.358402','TC00523','TC00524',NULL,NULL,NULL,0),(4,'2026-06-20','2026-06-20 02:12:31.828368',1,'09:14:00',_binary '','eeee','Cuộc gọi tự động kết thúc do hết thời lượng.','booking_4','09:13:00','2026-06-20 02:13:02.783446','CLOSED',_binary '','2026-06-20 02:14:02.491616','TC00523','TC00524',NULL,NULL,NULL,0),(5,'2026-06-20','2026-06-20 02:51:20.373992',1,'09:53:00',_binary '','tesst','Cuộc gọi tự động kết thúc do hết thời lượng.','booking_5','09:52:00','2026-06-20 02:52:07.181360','CLOSED',_binary '','2026-06-20 02:53:06.471116','TC00524','TC00123',NULL,NULL,NULL,0),(6,'2026-06-27','2026-06-27 01:52:25.268064',11,'09:04:00',_binary '','hello anh ạ',NULL,'booking_6','08:53:00','2026-06-27 01:53:02.265373','CANCELLED',_binary '','2026-06-27 01:54:27.238479','TC00523','TC00456',10,1,3,0),(7,'2026-06-27','2026-06-27 02:16:53.592276',11,'09:28:00',_binary '','helo ạ ',NULL,'booking_7','09:17:00','2026-06-27 02:17:21.631477','CANCELLED',_binary '','2026-06-27 02:19:02.223008','TC00523','TC00456',10,1,3,0),(8,'2026-06-27','2026-06-27 03:06:52.287845',11,'10:18:00',_binary '','hello','Cuoc goi tu dong ket thuc do het thoi luong.','booking_8','10:07:00','2026-06-27 03:07:34.210442','CLOSED',_binary '','2026-06-27 03:08:35.037834','TC00523','TC00456',10,1,3,0),(9,'2026-06-27','2026-06-27 03:40:03.429915',30,'11:30:00',_binary '\0','test',NULL,NULL,'11:00:00',NULL,'CANCELLED',_binary '\0','2026-07-19 03:55:05.984611','TC00456','TC00523',0,0,3,0),(10,'2026-07-19','2026-07-19 03:55:57.162492',1,'10:57:00',_binary '\0','dddd',NULL,'booking_10','10:56:00',NULL,'CANCELLED',_binary '\0','2026-07-19 03:56:35.654128','TC00523','TC00456',0,0,3,0),(11,'2026-07-19','2026-07-19 04:06:19.282543',1,'11:12:00',_binary '\0','ddđ','Tự động từ chối do quá hạn thời gian phê duyệt (lịch hẹn đã bắt đầu).',NULL,'11:11:00',NULL,'REJECTED',_binary '\0','2026-08-02 14:46:34.919092','TC00456','TC00523',0,0,3,0),(12,'2026-07-19','2026-07-19 04:09:36.351025',1,'11:13:00',_binary '\0','gggg','Tự động từ chối do quá hạn thời gian phê duyệt (lịch hẹn đã bắt đầu).',NULL,'11:12:00',NULL,'REJECTED',_binary '\0','2026-08-02 14:46:34.938864','TC00456','TC00523',0,0,3,0),(13,'2026-08-04','2026-08-03 02:26:34.180322',30,'09:30:00',_binary '\0','kjlhghdkjgh',NULL,'booking_13','09:00:00',NULL,'CANCELLED',_binary '\0','2026-08-03 03:03:24.729574','TC00523','TC00524',0,0,2,0),(14,'2026-08-03','2026-08-03 02:59:23.788617',1,'10:01:00',_binary '\0','hello ạ','Tự động từ chối do quá hạn thời gian phê duyệt (lịch hẹn đã bắt đầu).',NULL,'10:00:00',NULL,'REJECTED',_binary '\0','2026-08-03 03:00:05.561736','TC00523','TC00456',0,0,2,0),(15,'2026-08-03','2026-08-03 03:04:35.593755',1,'10:06:00',_binary '','ddđ','Cuộc gọi tự động kết thúc do hết thời lượng','booking_15','10:05:00','2026-08-03 03:05:07.024891','CLOSED',_binary '','2026-08-03 03:05:41.130185','TC00523','TC00524',0,0,2,0),(17,'2026-08-14','2026-08-14 02:04:37.235523',1,'09:06:00',_binary '','hello ạ','Cuộc gọi tự động kết thúc do hết thời lượng','booking_17','09:05:00','2026-08-14 02:05:02.234630','CLOSED',_binary '','2026-08-14 02:05:32.786734','TC00523','TC00524',0,0,2,0),(18,'2026-08-14','2026-08-14 02:06:14.062294',1,'09:12:00',_binary '\0','ddđ','xin lỗi nhé, nay tôi bận rồi!',NULL,'09:11:00',NULL,'REJECTED',_binary '\0','2026-08-14 02:06:46.023594','TC00523','TC00524',0,0,2,0),(19,'2026-08-14','2026-08-14 03:22:13.483736',1,'10:24:00',_binary '','chào anh ạ!','Cuộc gọi tự động kết thúc do hết thời lượng','booking_19','10:23:00','2026-08-14 03:23:09.067450','CLOSED',_binary '','2026-08-14 03:23:41.384902','TC00523','TC00524',0,0,2,0),(20,'2026-08-14','2026-08-14 06:05:19.248891',1,'13:07:00',_binary '','chào anh ạ','Cuộc gọi tự động kết thúc do hết thời lượng','booking_20','13:06:00','2026-08-14 06:06:13.787913','CLOSED',_binary '','2026-08-14 06:06:50.508962','TC00523','TC00524',0,0,2,0),(21,'2026-08-14','2026-08-14 07:26:22.361205',4,'14:31:00',_binary '','helloo anh ạ','Cuộc gọi tự động kết thúc do hết thời lượng','booking_21','14:27:00','2026-08-14 07:27:10.794614','CLOSED',_binary '','2026-08-14 07:27:41.190846','TC00523','TC00524',3,1,2,0),(22,'2026-08-20','2026-08-20 01:14:42.008081',1,'08:20:00',_binary '','hihi','Cuộc gọi tự động kết thúc do hết thời lượng','booking_22','08:19:00','2026-08-20 01:19:01.151951','CLOSED',_binary '','2026-08-20 01:19:33.127967','TC00523','TC00123',0,0,2,0),(23,'2026-08-21','2026-08-21 01:07:40.050540',1,'08:09:00',_binary '','ggghhh','Cuộc gọi tự động kết thúc do hết thời lượng','booking_23','08:08:00','2026-08-21 01:08:04.073023','CLOSED',_binary '','2026-08-21 01:08:27.641586','TC00523','TC00123',0,0,2,0);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKiwylx6fb2dqdw8kfc31vaiiyp` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'WEB','2026-04-05 21:12:56.054242',_binary '','Lập trình web'),(2,'DM','2026-04-18 13:02:41.093736',_binary '','Digital Marketing'),(3,'GD','2026-04-18 13:03:08.004608',_binary '','Thiết kế đồ họa'),(4,'NH','2026-04-18 13:03:30.883238',_binary '\0','Quản trị Khách sạn');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `post_id` bigint NOT NULL,
  `username` varchar(20) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKlri30okf66phtcgbe5pok7cc0` (`parent_id`),
  KEY `FKh4c7lvsc298whoyd4w9ta25cr` (`post_id`),
  KEY `FKc71forj6rrlpbvc563oq8etd1` (`username`),
  CONSTRAINT `FKc71forj6rrlpbvc563oq8etd1` FOREIGN KEY (`username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKh4c7lvsc298whoyd4w9ta25cr` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKlri30okf66phtcgbe5pok7cc0` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (8,'hay quá ạ','2026-04-23 09:09:28.705091',NULL,48,'TC00456',NULL),(10,'test','2026-04-23 12:19:28.644731',NULL,53,'TC00456',NULL),(11,'@Nguyễn Hùng Thịnh1-8 : test2','2026-04-23 12:19:35.996242',10,53,'TC00456',NULL),(14,'hihi','2026-04-23 14:53:56.875062',NULL,61,'TC00456',NULL),(17,'haha','2026-06-04 03:44:32.181350',NULL,61,'TC00457',NULL),(18,'ssss','2026-06-04 03:46:27.335877',NULL,68,'TC00457',NULL),(21,'hih','2026-06-08 02:43:52.279944',NULL,57,'TC00523',NULL),(23,'chào ạ','2026-06-27 01:57:05.995781',NULL,61,'TC00456',NULL),(24,'chào ạ','2026-06-27 02:21:45.101216',NULL,76,'TC00456',NULL),(25,'hello','2026-06-27 03:02:27.395632',NULL,58,'TC00456',NULL),(26,'Hilo','2026-06-27 03:11:42.442618',NULL,68,'TC00523',NULL),(27,'Chào ạ','2026-06-27 03:14:15.580232',NULL,57,'TC00523',NULL),(29,'Hello','2026-07-04 03:20:24.434665',NULL,78,'TC00456',NULL),(30,'Chelloo','2026-07-04 03:20:46.672706',NULL,78,'TC00456',NULL),(42,'hello','2026-07-19 03:49:10.290730',25,58,'TC00524','2026-07-19 03:49:10.293280'),(44,'hahaha','2026-07-19 03:51:33.292732',NULL,84,'TC00456','2026-07-19 03:51:33.292732'),(45,'ôi','2026-07-19 06:37:50.821400',44,84,'TC00524',NULL),(48,'ehehee','2026-07-20 01:22:54.800971',NULL,98,'TC00524','2026-07-20 01:22:54.800971'),(51,'hekllo33','2026-07-20 02:30:00.129131',48,98,'TC00524','2026-07-20 02:30:10.410642'),(52,'Hello','2026-07-26 07:41:04.496561',NULL,91,'TC00523','2026-07-26 07:41:04.496561'),(54,'Heloo','2026-07-27 02:40:10.406141',48,98,'TC00523','2026-07-27 02:40:10.406141'),(55,'hello','2026-07-27 02:54:23.384829',NULL,105,'TC00524','2026-07-27 02:54:23.384829'),(56,'Bình','2026-07-27 03:06:03.389456',NULL,106,'TC00523','2026-07-27 03:06:03.390507'),(58,'hello','2026-08-14 07:13:57.872710',NULL,122,'TC00524','2026-08-14 07:13:57.872710');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_reports`
--

DROP TABLE IF EXISTS `document_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_note` text,
  `created_at` datetime(6) DEFAULT NULL,
  `detail` text,
  `reason` enum('COPYRIGHT','DUPLICATE','FAKE_CONTENT','INAPPROPRIATE','OTHER','SPAM') NOT NULL,
  `resolved_at` datetime(6) DEFAULT NULL,
  `status` enum('DISMISSED','PENDING','RESOLVED') NOT NULL,
  `document_id` bigint NOT NULL,
  `username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3wdvv9orkyes2eyebc6xff8kb` (`document_id`,`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_reports`
--

LOCK TABLES `document_reports` WRITE;
/*!40000 ALTER TABLE `document_reports` DISABLE KEYS */;
INSERT INTO `document_reports` VALUES (1,NULL,'2026-07-19 07:55:07.989988','','COPYRIGHT','2026-07-19 07:55:44.422757','DISMISSED',10,'TC00524'),(2,NULL,'2026-08-14 01:40:15.904045','','INAPPROPRIATE','2026-08-14 01:40:39.165389','RESOLVED',13,'TC00524');
/*!40000 ALTER TABLE `document_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `document_type` varchar(20) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category_id` bigint DEFAULT NULL,
  `download_count` int DEFAULT NULL,
  `file_public_id` varchar(255) DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `file_url` varchar(1000) NOT NULL,
  `rejection_reason` text,
  `status` enum('APPROVED','HIDDEN','PENDING','REJECTED') NOT NULL,
  `uploader_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK70g21yw6d0n958n3khscvgbls` (`category_id`),
  CONSTRAINT `FK70g21yw6d0n958n3khscvgbls` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (2,'2026-04-18 13:05:21.315086','Làm quen với \"xương sườn\" của website thông qua HTML5 và cách trang trí giao diện bằng CSS3 cơ bản.','WORD','WEB1013_Nhap_mon_lap_trinh_Web',1,0,'polyhub_documents/x3rwpz2vugjvddtyjniy',46592,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492319/polyhub_documents/x3rwpz2vugjvddtyjniy',NULL,'APPROVED','TC00523'),(3,'2026-04-18 13:05:44.969131','Học cách tạo ra các hiệu ứng chuyển động, kiểm tra dữ liệu biểu mẫu (validate) và tăng tính tương tác cho người dùng.','WORD','WEB2014_Lap_trinh_JavaScript',1,0,'polyhub_documents/sl1e1fsmxcq6plwykxiz',25630,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492343/polyhub_documents/sl1e1fsmxcq6plwykxiz',NULL,'APPROVED','TC00523'),(4,'2026-04-18 13:06:11.031148','Học cách thiết kế bảng, truy vấn và quản lý dữ liệu (như thông tin người dùng, sản phẩm)','WORD','COM2012_Co_so_du_lieu_SQL',1,0,'polyhub_documents/ogkgcl9y5boarpymbv42',37568,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492369/polyhub_documents/ogkgcl9y5boarpymbv42',NULL,'APPROVED','TC00523'),(5,'2026-04-18 13:08:56.363545','Tài liệu tổng quan về các kênh tiếp thị số (SEO, SEM, Social Media, Email Marketing)','WORD','MAR1013_Giao_trinh_Digital_Marketing',2,0,'polyhub_documents/lblswbrcpqjsjnuh9q5h',46592,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492534/polyhub_documents/lblswbrcpqjsjnuh9q5h',NULL,'APPROVED','TC00524'),(6,'2026-04-18 13:10:04.800922','Tài liệu tổng quan về các kênh tiếp thị số (SEO, SEM, Social Media, Email Marketing)','EXCEL','MAR1013_Giao_trinh_Digital_Marketing',2,0,'polyhub_documents/qljtzr7ucbhbibwxzmpx',49147,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492603/polyhub_documents/qljtzr7ucbhbibwxzmpx',NULL,'APPROVED','TC00524'),(7,'2026-04-18 13:10:39.922175','Hướng dẫn chi tiết cách thiết lập tài khoản quảng cáo, lựa chọn đối tượng mục tiêu (Targeting) và cách đọc các chỉ số đo lường hiệu quả (KPIs, ROI).','PDF','MAR3012_Tai_lieu_Google_Ads_Facebook_Ads',3,0,'polyhub_documents/smbvh0prbetqvthuyrqa',260471,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1776492637/polyhub_documents/smbvh0prbetqvthuyrqa.pdf',NULL,'APPROVED','TC00524'),(8,'2026-04-18 13:13:52.142846','ài liệu hướng dẫn quy chuẩn phục vụ bàn (Set up bàn tiệc, kỹ năng bưng khay, phục vụ rượu vang)','ZIP','RSM2013_Nghiep_vu_Nha_hang_Co_ban',4,2,'polyhub_documents/vu3qaubawq6c2chg9kpg',24475,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776492830/polyhub_documents/vu3qaubawq6c2chg9kpg',NULL,'APPROVED','TC00524'),(9,'2026-04-18 14:23:42.340421','test','WORD','TEsst',1,1,'polyhub_documents/a6ju2qgjv3zacelzvigm',46592,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1776497020/polyhub_documents/a6ju2qgjv3zacelzvigm',NULL,'APPROVED','TC00457'),(10,'2026-04-23 10:40:17.054220','Kiến thức về QLDA với Agile cơ bản cần nắm','PDF','Kiến thức về QLDA với Agile',1,2,'polyhub_documents/mwc3jaypzdiv2nwfy9yf',98360,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1776915616/polyhub_documents/mwc3jaypzdiv2nwfy9yf.pdf',NULL,'APPROVED','TC00523'),(11,'2026-04-23 14:30:58.457095','test','PDF','Test',2,2,'polyhub_documents/goicd7e6n3a79z1edicl',98360,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1776929458/polyhub_documents/goicd7e6n3a79z1edicl.pdf','etst','REJECTED','TC00523'),(13,'2026-08-14 01:39:13.154259','ddđ','PDF','tài liệu tets',1,1,'polyhub_documents/sss_1786671548714.pdf',8323069,'http://res.cloudinary.com/dueb9a4d9/raw/upload/v1786671551/polyhub_documents/sss_1786671548714.pdf','Tài liệu bị báo cáo vi phạm: Nội dung nhạy cảm, phản cảm','REJECTED','TC00524');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_busy_periods`
--

DROP TABLE IF EXISTS `mentor_busy_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_busy_periods` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_approved` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `end_time` datetime(6) NOT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `reliability_impact` double DEFAULT NULL,
  `start_time` datetime(6) NOT NULL,
  `mentor_username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhxg6pl7awc6lmdu8vrv2odv5k` (`mentor_username`),
  CONSTRAINT `FKhxg6pl7awc6lmdu8vrv2odv5k` FOREIGN KEY (`mentor_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_busy_periods`
--

LOCK TABLES `mentor_busy_periods` WRITE;
/*!40000 ALTER TABLE `mentor_busy_periods` DISABLE KEYS */;
INSERT INTO `mentor_busy_periods` VALUES (1,_binary '','2026-08-03 02:49:39.489846','2026-08-09 07:00:00.000000','[Bận đột xuất] thích',1.5,'2026-08-09 04:00:00.000000','TC00456');
/*!40000 ALTER TABLE `mentor_busy_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_requests`
--

DROP TABLE IF EXISTS `mentor_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `birthday` date DEFAULT NULL,
  `cccd_number` varchar(20) NOT NULL,
  `certificate_file` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `cv_file` varchar(255) NOT NULL,
  `degree_file` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fullname` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `introduction` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `motivation` varchar(1500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `rejection_reason` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(20) NOT NULL,
  `cccd_back_file` varchar(255) DEFAULT NULL,
  `cccd_front_file` varchar(255) DEFAULT NULL,
  `face_file` varchar(255) DEFAULT NULL,
  `admin_notes` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8ubphu6qejfglxl61rowdvoxq` (`username`),
  CONSTRAINT `FK8ubphu6qejfglxl61rowdvoxq` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_requests`
--

LOCK TABLES `mentor_requests` WRITE;
/*!40000 ALTER TABLE `mentor_requests` DISABLE KEYS */;
INSERT INTO `mentor_requests` VALUES (1,'1999-04-25','092208011233','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776330075/polyhub_documents/ypsxthbmx3qautbanh0w.png','2026-04-16 16:01:26.135675','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776330068/polyhub_documents/jjetkczamugb8zkgxpml.png','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776330085/polyhub_documents/oiguk5jsynlz26eta4rq.png','Thinh@gmail.com','Bé Thịnh','Đụ rất lâu ra','Chịch giảng viên','0999999999','cút','REVOKED','2026-04-18 12:31:02.957021','TC00123',NULL,NULL,NULL,NULL),(2,'2008-01-30','092208011233','http://res.cloudinary.com/dueb9a4d9/raw/upload/v1786691995/polyhub_documents/Nguy_n_H_ng_Th_nh-0965390169-TC00458-PTPM_1786691994120.pdf','2026-04-18 12:54:03.114698','http://res.cloudinary.com/dueb9a4d9/raw/upload/v1786691995/polyhub_documents/NguyenMinhNghia-0868103454-PhatTrienPhanMem-Tc00523_1786691994120.pdf','http://res.cloudinary.com/dueb9a4d9/raw/upload/v1786691995/polyhub_documents/NguyenMinhNghia-0868103454-PhatTrienPhanMem-Tc00523_1786691994120.pdf','thinhhung@gmail.com','NGUYỄN HÙNG THỊNH','Chào các bạn! Tôi là [Tên], một người đồng hành luôn tràn đầy nhiệt huyết. Với nền tảng trong mảng [Ngành nghề], tôi ở đây để lắng nghe những khó khăn, định hướng mục tiêu và chia sẻ kinh nghiệm thực chiến. Hãy cùng nhau khai phá tiềm năng và chinh phục những cột mốc mới trong hành trình của bạn!','Chào các bạn! Tôi là [Tên], một người đồng hành luôn tràn đầy nhiệt huyết. Với nền tảng trong mảng [Ngành nghề], tôi ở đây để lắng nghe những khó khăn, định hướng mục tiêu và chia sẻ kinh nghiệm thực chiến. Hãy cùng nhau khai phá tiềm năng và chinh phục những cột mốc mới trong hành trình của bạn!','09999999111',NULL,'APPROVED','2026-08-14 07:21:41.281383','TC00524','http://res.cloudinary.com/dueb9a4d9/image/upload/v1786691994/polyhub_documents/z7996253929552_731637fcc8e1baa0c04e71b2a350f21c_1786691994119.jpg','http://res.cloudinary.com/dueb9a4d9/image/upload/v1786691995/polyhub_documents/z7996253919005_e0aebe1f163368ba10e3c8b9884132a3_1786691994119.jpg','http://res.cloudinary.com/dueb9a4d9/raw/upload/v1786692001/polyhub_documents/liveness_1786691994119.webm','bổ sung bạn nhé.'),(3,'2026-04-29','123456789012','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776492025/polyhub_documents/unevtpiibavwwbrzunkc.png','2026-04-18 13:00:28.244529','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776492023/polyhub_documents/u3ny5wgurkfdcb2vx90p.pdf','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776492026/polyhub_documents/o4iwo8bursxt6ecpjo7t.png','nghianmtc00523@gmail.com','Nguyễn Minh Nghĩa','Chào các bạn','Tôi sẽ cùng các bạn chinh phục con đường mới nhé','0987654323',NULL,'APPROVED','2026-04-18 13:00:33.076268','TC00523',NULL,NULL,NULL,NULL),(4,'2026-04-15','098765342423','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776929283/polyhub_documents/mz5crgse8ubal3es2yej.jpg','2026-04-18 14:19:49.087080','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776929281/polyhub_documents/aeiqnwfglbzda2kb2zzf.pdf','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776929285/polyhub_documents/oc4ij8vb3owlfn2thwzf.jpg','thinhnhtc00458@gmail.com','thinh nguyen','Test','Test','0965390169',NULL,'APPROVED','2026-04-23 14:29:56.595965','TC00457',NULL,NULL,NULL,NULL),(5,'2007-11-21','092208011233','http://res.cloudinary.com/dueb9a4d9/image/upload/v1782530802/polyhub_documents/d8besa5es2jdbthn35fe.pdf','2026-06-08 02:57:57.505483','http://res.cloudinary.com/dueb9a4d9/image/upload/v1782530800/polyhub_documents/yaguepj2fnzsx0jdj5tt.pdf','http://res.cloudinary.com/dueb9a4d9/image/upload/v1782530804/polyhub_documents/vkoja2un58zxqc7evjpl.pdf','thinhnhtc00458@gmail.com','Thịnh','xin chào tôi sẽ đồng hành cùng các bạn trong thời gian tới, xin cảm ơn các bạn','xin chào tôi sẽ đồng hành cùng các bạn trong thời gian tới, xin cảm ơn các bạn','0987645324',NULL,'APPROVED','2026-06-27 03:33:00.061645','TC00456',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `mentor_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mentor_schedules`
--

DROP TABLE IF EXISTS `mentor_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `day_of_week` int NOT NULL,
  `end_time` time NOT NULL,
  `start_time` time NOT NULL,
  `mentor_username` varchar(20) NOT NULL,
  `expire_date` date DEFAULT NULL,
  `specific_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK6g8vn611leg5u11d9ofyeu3jr` (`mentor_username`),
  CONSTRAINT `FK6g8vn611leg5u11d9ofyeu3jr` FOREIGN KEY (`mentor_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentor_schedules`
--

LOCK TABLES `mentor_schedules` WRITE;
/*!40000 ALTER TABLE `mentor_schedules` DISABLE KEYS */;
INSERT INTO `mentor_schedules` VALUES (3,7,'11:00:00','09:50:00','TC00524',NULL,NULL),(9,8,'12:00:00','11:00:00','TC00456',NULL,NULL),(24,6,'11:00:00','08:00:00','TC00523',NULL,'2026-08-21');
/*!40000 ALTER TABLE `mentor_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `link` varchar(100) DEFAULT NULL,
  `title` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `sender_username` varchar(20) DEFAULT NULL,
  `user_username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKeae560dc46bv1j7n9qy9rtrfw` (`sender_username`),
  CONSTRAINT `FKeae560dc46bv1j7n9qy9rtrfw` FOREIGN KEY (`sender_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-06-20 lúc 09:05.','2026-06-20 02:00:23.585422',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(2,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-20 lúc 09:05.','2026-06-20 02:00:23.591423',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(3,'Mentor Nguyễn Minh Nghĩa đã từ chối lịch hẹn ngày 2026-06-20 lúc 09:05. Lý do: xin lỗi nay tôi bận \n','2026-06-20 02:01:04.200797',_binary '','/bookings','Lịch hẹn bị từ chối',NULL,NULL,NULL,NULL,''),(4,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-06-20 lúc 09:09.','2026-06-20 02:08:28.594581',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(5,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-20 lúc 09:09.','2026-06-20 02:08:28.600574',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(6,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-20 lúc 09:09.','2026-06-20 02:08:52.978243',_binary '','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(7,'Sinh viên MNN 1-3 đã hủy lịch hẹn ngày 2026-06-20.','2026-06-20 02:10:33.661642',_binary '\0','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,''),(8,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-06-20 lúc 09:12.','2026-06-20 02:11:27.495012',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(9,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-20 lúc 09:12.','2026-06-20 02:11:27.499252',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(10,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-20 lúc 09:12.','2026-06-20 02:11:35.786180',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(11,'Sinh viên MNN 1-3 đã hủy lịch hẹn ngày 2026-06-20.','2026-06-20 02:11:52.349468',_binary '\0','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,''),(12,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-06-20 lúc 09:13.','2026-06-20 02:12:31.834364',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(13,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-20 lúc 09:13.','2026-06-20 02:12:31.838685',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(14,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-20 lúc 09:13.','2026-06-20 02:12:42.777357',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(15,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-06-20 02:14:02.485456',_binary '','/bookings','Cuộc gọi kết thúc',NULL,NULL,NULL,NULL,''),(16,'Sinh viên MNN 1-3 đã kết thúc cuộc gọi.','2026-06-20 02:14:03.075090',_binary '\0','/bookings','Cuộc gọi kết thúc',NULL,NULL,NULL,NULL,''),(17,'Trần Phong đã đặt lịch call video với bạn ngày 2026-06-20 lúc 09:52.','2026-06-20 02:51:20.411511',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(18,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor MNN 1-3 ngày 2026-06-20 lúc 09:52.','2026-06-20 02:51:20.422131',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(19,'Mentor MNN 1-3 đã chấp nhận lịch hẹn ngày 2026-06-20 lúc 09:52.','2026-06-20 02:51:41.679353',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(20,'Mentor MNN 1-3 đã kết thúc cuộc gọi.','2026-06-20 02:53:06.447840',_binary '\0','/bookings','Cuộc gọi kết thúc',NULL,NULL,NULL,NULL,''),(21,'Sinh viên Trần Phong đã kết thúc cuộc gọi.','2026-06-20 02:53:07.050905',_binary '\0','/bookings','Cuộc gọi kết thúc',NULL,NULL,NULL,NULL,''),(22,'Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-06-27 lúc 08:53.','2026-06-27 01:52:25.287586',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(23,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-27 lúc 08:53.','2026-06-27 01:52:25.293065',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(24,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-27 lúc 08:53.','2026-06-27 01:52:33.020096',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(25,'Nguyễn Minh Nghĩa đã gia hạn cuộc gọi thêm 10 phút. Thời gian mới: 11 phút.','2026-06-27 01:53:52.663335',_binary '\0','/bookings','Cuộc gọi được gia hạn',NULL,NULL,NULL,NULL,''),(26,'Sinh viên Nguyễn Hùng Thịnh1-8 đã hủy lịch hẹn ngày 2026-06-27.','2026-06-27 01:54:27.225391',_binary '\0','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,''),(27,'Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-06-27 lúc 09:17.','2026-06-27 02:16:53.701875',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(28,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-27 lúc 09:17.','2026-06-27 02:16:53.709966',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(29,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-27 lúc 09:17.','2026-06-27 02:17:11.769765',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(30,'Nguyễn Minh Nghĩa đã gia hạn cuộc gọi thêm 10 phút. Thời gian mới: 11 phút.','2026-06-27 02:18:04.920772',_binary '\0','/bookings','Cuộc gọi được gia hạn',NULL,NULL,NULL,NULL,''),(31,'Sinh viên Nguyễn Hùng Thịnh1-8 đã hủy lịch hẹn ngày 2026-06-27.','2026-06-27 02:19:02.202551',_binary '\0','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,''),(32,'Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-06-27 lúc 10:07.','2026-06-27 03:06:52.305094',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(33,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-06-27 lúc 10:07.','2026-06-27 03:06:52.308976',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(34,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-06-27 lúc 10:07.','2026-06-27 03:07:27.035865',_binary '\0','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,''),(35,'Nguyễn Hùng Thịnh1-8 đã gia hạn cuộc gọi thêm 10 phút. Thời gian mới: 11 phút.','2026-06-27 03:08:19.484396',_binary '\0','/bookings','Cuộc gọi được gia hạn',NULL,NULL,NULL,NULL,''),(36,'Sinh viên Nguyễn Hùng Thịnh1-8 đã hủy lịch hẹn ngày 2026-06-27.','2026-06-27 03:08:33.930686',_binary '\0','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,''),(37,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-06-27 03:08:35.013506',_binary '\0','/bookings','Cuộc gọi kết thúc',NULL,NULL,NULL,NULL,''),(38,'Nguyễn Minh Nghĩa đã đặt lịch call video với bạn ngày 2026-06-27 lúc 11:00.','2026-06-27 03:40:03.456569',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(39,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Hùng Thịnh1-8 ngày 2026-06-27 lúc 11:00.','2026-06-27 03:40:03.460410',_binary '\0','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,''),(40,'Tài khoản của bạn đã bị tước quyền Mentor và chuyển về vai trò Học viên với lý do: gfeyeyefefefe','2026-07-04 01:20:30.429243',_binary '\0','/','Tước quyền Mentor',NULL,NULL,NULL,NULL,''),(41,NULL,'2026-07-19 03:49:10.410114',_binary '',NULL,NULL,'đã trả lời bình luận của bạn: \"hello\"',58,'COMMENT','TC00524','TC00456'),(42,NULL,'2026-07-19 03:49:26.429452',_binary '\0',NULL,NULL,'đã trả lời bình luận của bạn: \"@TC00457 ghê vậy\"',50,'COMMENT','TC00524','TC00457'),(43,'Sinh viên Nguyễn Minh Nghĩa đã hủy lịch hẹn ngày 2026-06-27.','2026-07-19 03:55:05.917227',_binary '','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,'TC00456'),(44,'Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-07-19 lúc 10:56.','2026-07-19 03:55:57.316231',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,'TC00523'),(45,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-07-19 lúc 10:56.','2026-07-19 03:55:57.320432',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,'TC00456'),(46,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-07-19 lúc 10:56.','2026-07-19 03:56:13.467583',_binary '','/bookings','Lịch hẹn được chấp nhận',NULL,NULL,NULL,NULL,'TC00456'),(47,'Sinh viên Nguyễn Hùng Thịnh1-8 đã hủy lịch hẹn ngày 2026-07-19.','2026-07-19 03:56:35.644713',_binary '','/bookings','Lịch hẹn đã bị hủy',NULL,NULL,NULL,NULL,'TC00523'),(48,'Nguyễn Minh Nghĩa đã đặt lịch call video với bạn ngày 2026-07-19 lúc 11:11.','2026-07-19 04:06:19.300491',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,'TC00456'),(49,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Hùng Thịnh1-8 ngày 2026-07-19 lúc 11:11.','2026-07-19 04:06:19.309957',_binary '','/bookings','Yêu cầu đặt lịch mới',NULL,NULL,NULL,NULL,'TC00523'),(50,'Nguyễn Minh Nghĩa đã đặt lịch call video với bạn ngày 2026-07-19 lúc 11:12.','2026-07-19 04:09:36.458107',_binary '','/bookings','Yêu cầu đặt lịch mới','Nguyễn Minh Nghĩa đã đặt lịch call video với bạn ngày 2026-07-19 lúc 11:12.',NULL,'BOOKING',NULL,'TC00456'),(51,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Hùng Thịnh1-8 ngày 2026-07-19 lúc 11:12.','2026-07-19 04:09:36.464077',_binary '','/bookings','Yêu cầu đặt lịch mới','Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Hùng Thịnh1-8 ngày 2026-07-19 lúc 11:12.',NULL,'BOOKING',NULL,'TC00523'),(52,'Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.','2026-07-19 06:02:11.923201',_binary '','/mentors/register','Yêu cầu bổ sung hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(53,NULL,'2026-07-19 06:37:50.858938',_binary '\0',NULL,NULL,'đã trả lời bình luận của bạn: \"ôi\"',84,'COMMENT','TC00524','TC00456'),(54,'Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.','2026-07-19 07:02:52.664460',_binary '','/mentors/register','Yêu cầu bổ sung hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(55,NULL,'2026-07-19 07:07:22.638073',_binary '\0',NULL,NULL,'đã trả lời bình luận của bạn: \"hello\"',78,'COMMENT','TC00524','TC00456'),(56,'Rất tiếc, yêu cầu Mentor của bạn đã bị từ chối với lý do: dddddddddddddddddddddddddddddddddddddd','2026-07-19 07:20:12.801135',_binary '','/mentors/register','Từ chối hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(57,NULL,'2026-07-19 09:59:41.170453',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',90,'SHARE','TC00524','TC00523'),(58,NULL,'2026-07-19 15:22:56.993686',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',96,'SHARE','TC00524','TC00523'),(59,NULL,'2026-07-20 01:23:19.274338',_binary '',NULL,NULL,'đã trả lời bình luận của bạn: \"được được\"',98,'COMMENT','TC00523','TC00524'),(60,NULL,'2026-07-20 01:23:38.872095',_binary '',NULL,NULL,'đã trả lời bình luận của bạn: \"ngon nèeeee\"',98,'COMMENT','TC00523','TC00524'),(61,NULL,'2026-07-20 01:24:23.020830',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',100,'SHARE','TC00524','TC00523'),(62,'Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.','2026-07-20 01:55:28.277055',_binary '','/mentors/register','Yêu cầu bổ sung hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(63,NULL,'2026-07-20 02:30:39.027981',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',102,'SHARE','TC00524','TC00523'),(64,NULL,'2026-07-26 07:41:01.432907',_binary '',NULL,NULL,'đã thích bài viết của bạn.',91,'LIKE','TC00523','TC00524'),(65,NULL,'2026-07-26 07:41:04.501077',_binary '',NULL,NULL,'đã bình luận về bài viết của bạn: \"Hello\"',91,'COMMENT','TC00523','TC00524'),(66,NULL,'2026-07-26 07:49:14.560889',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',103,'SHARE','TC00523','TC00524'),(67,NULL,'2026-07-26 07:51:10.493354',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',104,'SHARE','TC00523','TC00524'),(68,NULL,'2026-07-26 07:51:21.793739',_binary '',NULL,NULL,'đã bắt đầu theo dõi bạn.',NULL,'FOLLOW','TC00524','TC00523'),(69,NULL,'2026-07-27 02:40:10.473257',_binary '',NULL,NULL,'đã trả lời bình luận của bạn: \"Heloo\"',98,'COMMENT','TC00523','TC00524'),(70,NULL,'2026-07-27 02:42:01.943121',_binary '',NULL,NULL,'đã chia sẻ bài viết của bạn.',106,'SHARE','TC00523','TC00524'),(71,NULL,'2026-07-27 02:54:23.414939',_binary '',NULL,NULL,'đã bình luận về bài viết của bạn: \"hello\"',105,'COMMENT','TC00524','TC00523'),(72,'Yêu cầu đặt lịch ngày 2026-07-19 lúc 11:11 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.','2026-08-02 14:46:34.800506',_binary '','/bookings','Lịch hẹn bị hủy tự động','Yêu cầu đặt lịch ngày 2026-07-19 lúc 11:11 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.',NULL,'BOOKING',NULL,'TC00523'),(73,'Yêu cầu đặt lịch ngày 2026-07-19 lúc 11:12 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.','2026-08-02 14:46:34.935346',_binary '','/bookings','Lịch hẹn bị hủy tự động','Yêu cầu đặt lịch ngày 2026-07-19 lúc 11:12 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.',NULL,'BOOKING',NULL,'TC00523'),(74,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-04 lúc 09:00.','2026-08-03 02:26:34.185058',_binary '','/bookings','Yêu cầu đặt lịch mới','MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-04 lúc 09:00.',NULL,'BOOKING',NULL,'TC00523'),(75,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-04 lúc 09:00.','2026-08-03 02:26:34.188377',_binary '','/bookings','Yêu cầu đặt lịch mới','Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-04 lúc 09:00.',NULL,'BOOKING',NULL,'TC00524'),(76,'Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-08-03 lúc 10:00.','2026-08-03 02:59:23.792461',_binary '','/bookings','Yêu cầu đặt lịch mới','Nguyễn Hùng Thịnh1-8 đã đặt lịch call video với bạn ngày 2026-08-03 lúc 10:00.',NULL,'BOOKING',NULL,'TC00523'),(77,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-03 lúc 10:00.','2026-08-03 02:59:23.793568',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-03 lúc 10:00.',NULL,'BOOKING',NULL,'TC00456'),(78,'Yêu cầu đặt lịch ngày 2026-08-03 lúc 10:00 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.','2026-08-03 03:00:05.557534',_binary '\0','/bookings','Lịch hẹn bị hủy tự động','Yêu cầu đặt lịch ngày 2026-08-03 lúc 10:00 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.',NULL,'BOOKING',NULL,'TC00456'),(79,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-04 lúc 09:00.','2026-08-03 03:01:16.036526',_binary '','/bookings','Lịch hẹn được chấp nhận','Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-04 lúc 09:00.',NULL,'BOOKING',NULL,'TC00524'),(80,'Sinh viên MNN 1-3 đã hủy lịch hẹn ngày 2026-08-04.','2026-08-03 03:03:24.727573',_binary '','/bookings','Lịch hẹn đã bị hủy','Sinh viên MNN 1-3 đã hủy lịch hẹn ngày 2026-08-04.',NULL,'BOOKING',NULL,'TC00523'),(81,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-03 lúc 10:05.','2026-08-03 03:04:35.597754',_binary '','/bookings','Yêu cầu đặt lịch mới','MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-03 lúc 10:05.',NULL,'BOOKING',NULL,'TC00523'),(82,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-03 lúc 10:05.','2026-08-03 03:04:35.598891',_binary '','/bookings','Yêu cầu đặt lịch mới','Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-03 lúc 10:05.',NULL,'BOOKING',NULL,'TC00524'),(83,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-03 lúc 10:05.','2026-08-03 03:04:54.942170',_binary '','/bookings','Lịch hẹn được chấp nhận','Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-03 lúc 10:05.',NULL,'BOOKING',NULL,'TC00524'),(84,'Sinh viên MNN 1-3 đã kết thúc cuộc gọi.','2026-08-03 03:05:41.127091',_binary '','/bookings','Cuộc gọi kết thúc','Sinh viên MNN 1-3 đã kết thúc cuộc gọi.',NULL,'BOOKING',NULL,'TC00523'),(85,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-03 03:05:52.388548',_binary '','/bookings','Cuộc gọi kết thúc','Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'BOOKING',NULL,'TC00524'),(86,'Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.','2026-08-14 01:34:45.100932',_binary '','/mentors/register','Yêu cầu bổ sung hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(87,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 08:46.','2026-08-14 01:45:41.660842',_binary '\0','/bookings','Yêu cầu đặt lịch mới','MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 08:46.',NULL,'BOOKING',NULL,'TC00523'),(88,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 08:46.','2026-08-14 01:45:41.667104',_binary '','/bookings','Yêu cầu đặt lịch mới','Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 08:46.',NULL,'BOOKING',NULL,'TC00524'),(89,'Yêu cầu đặt lịch ngày 2026-08-14 lúc 08:46 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.','2026-08-14 01:46:08.722332',_binary '','/bookings','Lịch hẹn bị hủy tự động','Yêu cầu đặt lịch ngày 2026-08-14 lúc 08:46 đã bị hủy tự động do quá giờ bắt đầu mà chưa được Mentor phê duyệt.',NULL,'BOOKING',NULL,'TC00524'),(90,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 09:05.','2026-08-14 02:04:37.279507',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 09:05.',NULL,'SYSTEM',NULL,'TC00523'),(91,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 09:05.','2026-08-14 02:04:37.283896',_binary '','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 09:05.',NULL,'SYSTEM',NULL,'TC00524'),(92,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 09:05.','2026-08-14 02:04:53.192279',_binary '','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 09:05.',NULL,'SYSTEM',NULL,'TC00524'),(93,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-14 02:05:32.772746',_binary '','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00524'),(94,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 09:11.','2026-08-14 02:06:14.069303',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 09:11.',NULL,'SYSTEM',NULL,'TC00523'),(95,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 09:11.','2026-08-14 02:06:14.071926',_binary '','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 09:11.',NULL,'SYSTEM',NULL,'TC00524'),(96,'Mentor Nguyễn Minh Nghĩa đã từ chối lịch hẹn ngày 2026-08-14 lúc 09:11. Lý do: xin lỗi nhé, nay tôi bận rồi!','2026-08-14 02:06:46.014847',_binary '','/bookings','Lịch hẹn bị từ chối','Lịch hẹn bị từ chối: Mentor Nguyễn Minh Nghĩa đã từ chối lịch hẹn ngày 2026-08-14 lúc 09:11. Lý do: xin lỗi nhé, nay tôi bận rồi!',NULL,'SYSTEM',NULL,'TC00524'),(97,'Hồ sơ Mentor của bạn cần bổ sung thêm thông tin. Vui lòng kiểm tra email và cập nhật lại hồ sơ.','2026-08-14 03:21:15.056462',_binary '','/mentors/register','Yêu cầu bổ sung hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(98,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 10:23.','2026-08-14 03:22:13.496257',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 10:23.',NULL,'SYSTEM',NULL,'TC00523'),(99,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 10:23.','2026-08-14 03:22:13.498478',_binary '','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 10:23.',NULL,'SYSTEM',NULL,'TC00524'),(100,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 10:23.','2026-08-14 03:22:36.254635',_binary '','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 10:23.',NULL,'SYSTEM',NULL,'TC00524'),(101,'Sinh viên MNN 1-3 đã kết thúc cuộc gọi.','2026-08-14 03:23:41.282644',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Sinh viên MNN 1-3 đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00523'),(102,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-14 03:23:50.406403',_binary '','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00524'),(103,'Rất tiếc, yêu cầu Mentor của bạn đã bị từ chối với lý do: tesst','2026-08-14 06:00:52.855505',_binary '\0','/mentors/register','Từ chối hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(104,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 13:06.','2026-08-14 06:05:19.256844',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 13:06.',NULL,'SYSTEM',NULL,'TC00523'),(105,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 13:06.','2026-08-14 06:05:19.260166',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 13:06.',NULL,'SYSTEM',NULL,'TC00524'),(106,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 13:06.','2026-08-14 06:05:31.114227',_binary '\0','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 13:06.',NULL,'SYSTEM',NULL,'TC00524'),(107,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-14 06:06:50.497209',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00524'),(108,'Chúc mừng! Yêu cầu trở thành Mentor của bạn đã được ban quản trị phê duyệt.','2026-08-14 07:21:41.279354',_binary '\0','/mentors','Phê duyệt hồ sơ Mentor',NULL,NULL,NULL,NULL,'TC00524'),(109,'MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 14:27.','2026-08-14 07:26:22.364254',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: MNN 1-3 đã đặt lịch call video với bạn ngày 2026-08-14 lúc 14:27.',NULL,'SYSTEM',NULL,'TC00523'),(110,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 14:27.','2026-08-14 07:26:22.365265',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-14 lúc 14:27.',NULL,'SYSTEM',NULL,'TC00524'),(111,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 14:27.','2026-08-14 07:26:55.611934',_binary '\0','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-14 lúc 14:27.',NULL,'SYSTEM',NULL,'TC00524'),(112,'MNN 1-3 đã gia hạn cuộc gọi thêm 3 phút. Thời gian mới: 4 phút.','2026-08-14 07:27:28.079121',_binary '\0','/bookings','Cuộc gọi được gia hạn','Cuộc gọi được gia hạn: MNN 1-3 đã gia hạn cuộc gọi thêm 3 phút. Thời gian mới: 4 phút.',NULL,'SYSTEM',NULL,'TC00523'),(113,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-14 07:27:41.189839',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00524'),(114,'Sinh viên MNN 1-3 đã kết thúc cuộc gọi.','2026-08-14 07:27:46.520967',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Sinh viên MNN 1-3 đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00523'),(115,'Trần Phong đã đặt lịch call video với bạn ngày 2026-08-20 lúc 08:19.','2026-08-20 01:14:42.031175',_binary '','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Trần Phong đã đặt lịch call video với bạn ngày 2026-08-20 lúc 08:19.',NULL,'SYSTEM',NULL,'TC00523'),(116,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-20 lúc 08:19.','2026-08-20 01:14:42.041270',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-20 lúc 08:19.',NULL,'SYSTEM',NULL,'TC00123'),(117,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-20 lúc 08:19.','2026-08-20 01:15:33.386924',_binary '\0','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-20 lúc 08:19.',NULL,'SYSTEM',NULL,'TC00123'),(118,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-20 01:19:33.101181',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00123'),(119,'Sinh viên Trần Phong đã kết thúc cuộc gọi.','2026-08-20 01:19:53.576083',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Sinh viên Trần Phong đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00523'),(120,'Trần Phong đã đặt lịch call video với bạn ngày 2026-08-21 lúc 08:08.','2026-08-21 01:07:40.057871',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Trần Phong đã đặt lịch call video với bạn ngày 2026-08-21 lúc 08:08.',NULL,'SYSTEM',NULL,'TC00523'),(121,'Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-21 lúc 08:08.','2026-08-21 01:07:40.061978',_binary '\0','/bookings','Yêu cầu đặt lịch mới','Yêu cầu đặt lịch mới: Bạn đã gửi yêu cầu đặt lịch call video với Mentor Nguyễn Minh Nghĩa ngày 2026-08-21 lúc 08:08.',NULL,'SYSTEM',NULL,'TC00123'),(122,'Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-21 lúc 08:08.','2026-08-21 01:07:57.267935',_binary '\0','/bookings','Lịch hẹn được chấp nhận','Lịch hẹn được chấp nhận: Mentor Nguyễn Minh Nghĩa đã chấp nhận lịch hẹn ngày 2026-08-21 lúc 08:08.',NULL,'SYSTEM',NULL,'TC00123'),(123,'Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.','2026-08-21 01:08:27.389585',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Mentor Nguyễn Minh Nghĩa đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00123'),(124,'Sinh viên Trần Phong đã kết thúc cuộc gọi.','2026-08-21 01:08:42.255728',_binary '\0','/bookings','Cuộc gọi kết thúc','Cuộc gọi kết thúc: Sinh viên Trần Phong đã kết thúc cuộc gọi.',NULL,'SYSTEM',NULL,'TC00523');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `post_id` bigint NOT NULL,
  `username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKaawaqxjs3br8dw5v90w7uu514` (`post_id`),
  KEY `FK42xmy8fx0qc0l0bb5g57ngegy` (`username`),
  CONSTRAINT `FK42xmy8fx0qc0l0bb5g57ngegy` FOREIGN KEY (`username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKaawaqxjs3br8dw5v90w7uu514` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_images`
--

DROP TABLE IF EXISTS `post_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `display_order` int DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `public_id` varchar(255) DEFAULT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKo1i5va2d8de9mwq727vxh0s05` (`post_id`),
  CONSTRAINT `FKo1i5va2d8de9mwq727vxh0s05` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_images`
--

LOCK TABLES `post_images` WRITE;
/*!40000 ALTER TABLE `post_images` DISABLE KEYS */;
INSERT INTO `post_images` VALUES (1,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784085032/polyhub_posts/sq6dbaapnptipsfdecvt.png','polyhub_posts/sq6dbaapnptipsfdecvt',83),(2,1,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784085036/polyhub_posts/ukjabmq8fgnzekr5mnnb.png','polyhub_posts/ukjabmq8fgnzekr5mnnb',83),(3,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784427138/polyhub_posts/pd8emjpeirvqduy9le7f.png','polyhub_posts/pd8emjpeirvqduy9le7f',84),(4,1,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784427141/polyhub_posts/aenwfot9xv4bukuzjfos.png','polyhub_posts/aenwfot9xv4bukuzjfos',84),(5,2,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784427144/polyhub_posts/tx5airsytzgq5g40v9rr.png','polyhub_posts/tx5airsytzgq5g40v9rr',84),(6,3,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784427147/polyhub_posts/cqwleucrviadpegwkfln.png','polyhub_posts/cqwleucrviadpegwkfln',84),(14,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456055/polyhub_posts/n9jz7dl5r4tt9jaeyrr3.jpg','polyhub_posts/n9jz7dl5r4tt9jaeyrr3',91),(15,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456093/polyhub_posts/lawjl9z2txw0ggoxwwne.jpg','polyhub_posts/lawjl9z2txw0ggoxwwne',92),(16,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456161/polyhub_posts/djvxijfclwosxln7b7h8.jpg','polyhub_posts/djvxijfclwosxln7b7h8',93),(17,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456238/polyhub_posts/d4ks8ug3wd2e1qsuoyiy.jpg','polyhub_posts/d4ks8ug3wd2e1qsuoyiy',94),(18,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456358/polyhub_posts/jocu3hcsglb6hlabmbsi.jpg','polyhub_posts/jocu3hcsglb6hlabmbsi',95),(19,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784474999/polyhub_posts/fkw1hvywqvsin60sfyiz.jpg','polyhub_posts/fkw1hvywqvsin60sfyiz',97),(20,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510411/polyhub_posts/adwsauamyhedgt6aityf.jpg','polyhub_posts/adwsauamyhedgt6aityf',98),(21,1,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510413/polyhub_posts/d0phqpb7abqownfb1wup.jpg','polyhub_posts/d0phqpb7abqownfb1wup',98),(22,2,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510415/polyhub_posts/hpobkbhl3puoh17bfft7.jpg','polyhub_posts/hpobkbhl3puoh17bfft7',98),(23,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510540/polyhub_posts/n7eezzeg6odi3nr745q6.jpg','polyhub_posts/n7eezzeg6odi3nr745q6',99),(24,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510795/polyhub_posts/ujx1zndh1ve5urkaqv2v.jpg','polyhub_posts/ujx1zndh1ve5urkaqv2v',101),(25,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1785674304/polyhub_posts/zelgytwdne8q3syvve7v.jpg','polyhub_posts/zelgytwdne8q3syvve7v',114),(26,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1785674585/polyhub_posts/rbe2iahammt5h9t5xe08.jpg','polyhub_posts/rbe2iahammt5h9t5xe08',115),(27,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1785722080/polyhub_posts/w4ggohflvibd9vemmsw5.jpg','polyhub_posts/w4ggohflvibd9vemmsw5',116),(28,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1785725124/polyhub_posts/wwjpolwwouxm8temwbqs.jpg','polyhub_posts/wwjpolwwouxm8temwbqs',117),(29,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1786671337/polyhub_posts/swznptiple5npgtrywpg.jpg','polyhub_posts/swznptiple5npgtrywpg',118),(30,1,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1786671339/polyhub_posts/fqehyvoqkrscecwwopae.jpg','polyhub_posts/fqehyvoqkrscecwwopae',118),(31,2,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1786671342/polyhub_posts/u5fojazo6oxbryhefak2.jpg','polyhub_posts/u5fojazo6oxbryhefak2',118),(32,0,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1786691518/polyhub_posts/fovegodcfxfy2hbkbxdx.jpg','polyhub_posts/fovegodcfxfy2hbkbxdx',122);
/*!40000 ALTER TABLE `post_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `post_id` bigint NOT NULL,
  `username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpc7lgwrqwrg0w73b33o66ghnt` (`post_id`,`username`),
  KEY `FK26je21so4jqbg7pa72dktmgfa` (`username`),
  CONSTRAINT `FK26je21so4jqbg7pa72dktmgfa` FOREIGN KEY (`username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKa5wxsgl4doibhbed9gm7ikie2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_reports`
--

DROP TABLE IF EXISTS `post_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `post_id` bigint DEFAULT NULL,
  `username` varchar(20) NOT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK7ccpkj5jys037f9pq98l31ya2` (`post_id`),
  KEY `FK8rmfg48qen2e3bvqv6orsa1qc` (`username`),
  CONSTRAINT `FK7ccpkj5jys037f9pq98l31ya2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FK8rmfg48qen2e3bvqv6orsa1qc` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_reports`
--

LOCK TABLES `post_reports` WRITE;
/*!40000 ALTER TABLE `post_reports` DISABLE KEYS */;
INSERT INTO `post_reports` VALUES (11,'2026-06-19 11:16:10.637178','Nội dung không phù hợp',68,'TC00456',NULL),(12,'2026-06-19 11:24:21.107074','Quấy rối hoặc bắt nạt',NULL,'TC00456','RESOLVED'),(13,'2026-06-20 02:54:38.299480','test',71,'TC00524','LOCK_REQUESTED');
/*!40000 ALTER TABLE `post_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` longtext,
  `created_at` datetime(6) DEFAULT NULL,
  `image_public_id` varchar(255) DEFAULT NULL,
  `image_url` varchar(1000) DEFAULT NULL,
  `username` varchar(20) NOT NULL,
  `comments_count` int NOT NULL DEFAULT '0',
  `likes_count` int NOT NULL DEFAULT '0',
  `major` varchar(255) DEFAULT NULL,
  `post_type` varchar(255) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `shares_count` int NOT NULL DEFAULT '0',
  `shared_post_id` bigint DEFAULT NULL,
  `is_private` bit(1) DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `hot_score` double NOT NULL,
  `is_locked` bit(1) DEFAULT NULL,
  `is_deleted` bit(1) DEFAULT NULL,
  `moderation_category` varchar(50) DEFAULT NULL,
  `moderation_reason` varchar(500) DEFAULT NULL,
  `moderation_status` enum('APPROVED','PENDING_REVIEW','REJECTED') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgif9jn7qt2vxraoqjll13y6q0` (`username`),
  KEY `FKmk5q3yvwj8drh5btwuvgbc0p0` (`shared_post_id`),
  KEY `FKijnwr3brs8vaosl80jg9rp7uc` (`category_id`),
  KEY `idx_posts_moderation_status` (`moderation_status`,`created_at`),
  CONSTRAINT `FKgif9jn7qt2vxraoqjll13y6q0` FOREIGN KEY (`username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKijnwr3brs8vaosl80jg9rp7uc` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `FKmk5q3yvwj8drh5btwuvgbc0p0` FOREIGN KEY (`shared_post_id`) REFERENCES `posts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (14,'UI/UX designer không chỉ là những người tạo nên \"Cái Hồn\" cho giao diện mà nó còn là nhà kiến tạo trải nghiệm, cầu nối giữa nhu cầu người dùng và mục tiêu kinh doanh của doanh nghiệp.','2026-04-18 12:34:53.888958','polyhub_documents/d3xa5br7afjcrrmwidcq','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776490491/polyhub_documents/d3xa5br7afjcrrmwidcq.jpg','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00006110230816570277,NULL,NULL,NULL,NULL,NULL),(15,'Sâu xa hơn, UI/UX Designer còn đóng vai trò là \"người kiến tạo sự tiện nghi\" trong kỷ nguyên số. Họ không đơn thuần vẽ ra những hình ảnh bắt mắt, mà là những kỹ sư tâm lý âm thầm nghiên cứu từng thói quen nhỏ nhất để xóa bỏ mọi rào cản giữa con người và công nghệ.','2026-04-18 12:36:17.121644','polyhub_documents/kovzdy6jz7kno9i4as96','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776490574/polyhub_documents/kovzdy6jz7kno9i4as96.jpg','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00004277161571599193,NULL,NULL,NULL,NULL,NULL),(17,'để tạo nên 1 website thực sự đẹp không chỉ là sự công hiến không ngừng nghỉ của các lập trình viên mà còn là tư duy thẩm mỹ độc đáo, sự thấu hiểu tâm lý người dùng (UI/UX) và tư duy nội dung chiến lược','2026-04-18 12:41:36.141595','polyhub_documents/f6qkiybmffi6r727j40d','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776490894/polyhub_documents/f6qkiybmffi6r727j40d.jpg','TC00123',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00003055115408285138,NULL,NULL,NULL,NULL,NULL),(18,'Bài chia sẻ hay quá ạ','2026-04-18 12:43:34.051347',NULL,NULL,'TC00123',0,0,NULL,NULL,NULL,0,14,_binary '\0',NULL,0.00003055115408285138,NULL,NULL,NULL,NULL,NULL),(48,'Đỉnh cao của sự thư thái và nạp năng lượng sáng tạo. ✨ Đôi khi, nguồn cảm hứng chỉ đơn giản là một chiếc lá và ánh nắng ban mai. 🌿 Chúc PolyHUB một ngày tràn đầy ý tưởng mới! 🐱','2026-04-23 09:09:20.780043','polyhub_documents/txnj3nnod1zk1ubf7yvc','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776910159/polyhub_documents/txnj3nnod1zk1ubf7yvc.jpg','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0000518959197629392,NULL,NULL,NULL,NULL,NULL),(53,'\"Việt Nam Lives In Me\" - và \"VIỆT TẦU\" chính là tuyên ngôn! ✨🇻🇳 Ai bảo truyền thống là cũ kỹ? Khi nón lá, rồng thiêng Việt kết hợp DJ set đẳng cấp, đây chính là cách Gen Z thổi hồn vào bản sắc! 🔥 30/4/2025, Đà Nẵng gọi tên anh em PolyHUBers quẩy bung nóc! Đừng quên kèo Free Chivas 18 nhá! 🐉🎶🥂','2026-04-23 09:42:11.337227','polyhub_documents/oxcqkmxathiutw1rghoa','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776912130/polyhub_documents/oxcqkmxathiutw1rghoa.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0001037918395258784,NULL,_binary '',NULL,NULL,NULL),(54,'Chút phong trần giữa đại ngàn xanh mướt, nơi mỗi góc máy đều kể về một chuyến đi đầy cảm hứng. Khám phá nét hoang sơ của thiên nhiên để thấy lòng mình nhẹ tênh.','2026-04-23 09:44:57.939159','polyhub_documents/zykcvewsmapnwtbjnczq','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776912297/polyhub_documents/zykcvewsmapnwtbjnczq.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.000032434949851837,NULL,NULL,NULL,NULL,NULL),(55,'Toả sáng giữa muôn vàn khó khăn, như vì sao vàng kiêu hãnh giữa dòng thác đỏ. Khí chất dẫn đầu, bản lĩnh tiên phong, luôn biết cách khẳng định giá trị riêng của mình.','2026-04-23 09:51:53.698323','polyhub_documents/m8eme5jqlano7uzpsnph','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776912713/polyhub_documents/m8eme5jqlano7uzpsnph.jpg','TC00457',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.000032434949851837,NULL,NULL,NULL,NULL,NULL),(57,'Tạm gác lại âu lo, cùng ra khơi để đón nhận những \"tin tốt lành\" và tận hưởng không gian biển trời xanh mát. Một buổi chiều câu cá đầy thư giãn đang chờ đợi bạn lúc 4 giờ chiều nay!','2026-04-23 09:54:56.870054','polyhub_documents/ln9c3tyzdz7jdpw7dckh','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776912896/polyhub_documents/ln9c3tyzdz7jdpw7dckh.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0001167658194666132,NULL,_binary '',NULL,NULL,NULL),(58,'Nơi mã nguồn chạm đến sự vô cực của vũ trụ. Khám phá không gian không chỉ là nhìn ra ngoài, mà còn là hiểu sâu vào bản chất của cấu trúc dữ liệu.','2026-04-23 10:02:10.246669','polyhub_documents/gc3qygfirupwnjtfx7kr','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776913329/polyhub_documents/gc3qygfirupwnjtfx7kr.jpg','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00011682676726199947,NULL,NULL,NULL,NULL,NULL),(59,'nôi dung hay','2026-04-23 12:19:48.929126',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,53,_binary '\0',NULL,0.00003248578389894133,NULL,NULL,NULL,NULL,NULL),(61,'Hehe, thật thú vị! 😂😊','2026-04-23 14:53:32.352032',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00010406319065457246,NULL,NULL,NULL,NULL,NULL),(63,' #Hỏiđáp','2026-06-02 07:29:44.821647',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.000059571266721225146,NULL,NULL,NULL,NULL,NULL),(68,'aaaaa','2026-06-04 03:46:21.502130',NULL,NULL,'TC00457',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00018504808410736094,NULL,NULL,NULL,NULL,NULL),(71,'hello cả nhà','2026-06-05 03:20:15.204002',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00008804256229011282,NULL,NULL,NULL,NULL,NULL),(76,'hello ','2026-06-27 02:21:11.152946','polyhub_documents/k5hzj8fulkeagkqrleae','http://res.cloudinary.com/dueb9a4d9/image/upload/v1782526868/polyhub_documents/k5hzj8fulkeagkqrleae.png','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '',NULL,0.00020804286086841605,NULL,NULL,NULL,NULL,NULL),(78,'hello ','2026-06-27 03:01:53.644701','polyhub_documents/exwj2yohaf2kpqdczdus','http://res.cloudinary.com/dueb9a4d9/image/upload/v1782529310/polyhub_documents/exwj2yohaf2kpqdczdus.png','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00027076288063148225,NULL,NULL,NULL,NULL,NULL),(79,'test','2026-06-27 03:02:34.746089',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,58,_binary '\0',NULL,0.00010413956947364703,NULL,NULL,NULL,NULL,NULL),(80,'Hello','2026-06-27 03:14:27.488882',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '',NULL,0.00010413956947364703,NULL,NULL,NULL,NULL,NULL),(82,'jdjdj','2026-07-15 03:06:47.448948',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00018863286583395322,_binary '\0',NULL,NULL,NULL,NULL),(83,'ssssss','2026-07-15 03:10:37.465579','polyhub_posts/sq6dbaapnptipsfdecvt','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784085032/polyhub_posts/sq6dbaapnptipsfdecvt.png','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00018863286583395322,_binary '\0',NULL,NULL,NULL,NULL),(84,'ahdasuidjasik','2026-07-19 02:12:33.560326','polyhub_posts/pd8emjpeirvqduy9le7f','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784427138/polyhub_posts/pd8emjpeirvqduy9le7f.png','TC00456',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0008045290892807412,_binary '\0',NULL,NULL,NULL,NULL),(90,'hay quá ạ\n','2026-07-19 09:59:41.046983',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,57,_binary '\0',NULL,0.00022690088263563031,_binary '\0',_binary '',NULL,NULL,NULL),(91,'Trong quy tắc thiết kế UI/UX 📊, có một số nguyên tắc cơ bản cần được tuân thủ để tạo ra giao diện người dùng trực quan và thân thiện 🤝. Thiết kế cần đảm bảo tính nhất quán 📈, tính trực quan 🔍 và tính tương tác 📱. Ngoài ra, việc sử dụng màu sắc 🎨, hình ảnh 📸 và typography 📄 cũng đóng vai trò quan trọng trong việc tạo ra trải nghiệm người dùng tốt 💻.','2026-07-19 10:14:20.532578','polyhub_posts/n9jz7dl5r4tt9jaeyrr3','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456055/polyhub_posts/n9jz7dl5r4tt9jaeyrr3.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '',NULL,0.0006807026479068909,_binary '\0',_binary '',NULL,NULL,NULL),(92,'Lập trình là một 🚀 hành trình không dễ dàng 🤔, đòi hỏi sự kiên nhẫn 🙏, sáng tạo 💡 và không ngừng học hỏi 📚.','2026-07-19 10:14:58.286439','polyhub_posts/lawjl9z2txw0ggoxwwne','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456093/polyhub_posts/lawjl9z2txw0ggoxwwne.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00022690088263563031,_binary '\0',_binary '\0',NULL,NULL,NULL),(93,'Hãy cố gắng học hành để sau này bạn sẽ đi đến được nơi mà bạn mơ ước 🌟. Hãy kiên trì và nỗ lực, vì thành công luôn chờ đợi những người dám cố gắng và theo đuổi mục tiêu của mình 🚀. Bạn có thể đạt được mọi thứ nếu bạn tin vào bản thân và không từ bỏ ước mơ 💪. Hãy tiếp tục cố gắng','2026-07-19 10:16:07.176113','polyhub_posts/djvxijfclwosxln7b7h8','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456161/polyhub_posts/djvxijfclwosxln7b7h8.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00022690088263563031,_binary '\0',_binary '\0',NULL,NULL,NULL),(94,'Cuối cùng, ngày này cũng đã tới chung kết World Cup! Hãy cùng nhau hưởng ứng và ủng hộ đội bóng yêu thích của mình nào, mọi người 🎉💥','2026-07-19 10:17:23.724182','polyhub_posts/d4ks8ug3wd2e1qsuoyiy','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456238/polyhub_posts/d4ks8ug3wd2e1qsuoyiy.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00045380176527126063,_binary '\0',_binary '',NULL,NULL,NULL),(95,'Bạn thích siêu anh hùng nào nhất trong vũ trụ Marvel? ','2026-07-19 10:19:24.027442','polyhub_posts/jocu3hcsglb6hlabmbsi','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784456358/polyhub_posts/jocu3hcsglb6hlabmbsi.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.00045380176527126063,_binary '\0',_binary '',NULL,NULL,NULL),(96,'HAy quá ạ','2026-07-19 15:22:56.904830',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,94,_binary '\0',NULL,0.00022908331208851255,_binary '\0',_binary '',NULL,NULL,NULL),(97,'Thời khắc cuối cùng hãy để 2H sáng hôm nay nói lên kết quả!!!','2026-07-19 15:30:04.730485','polyhub_posts/fkw1hvywqvsin60sfyiz','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784474999/polyhub_posts/fkw1hvywqvsin60sfyiz.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0004581666241770251,_binary '\0',_binary '',NULL,NULL,NULL),(98,'Là ai nhỉ?','2026-07-20 01:20:16.043330','polyhub_posts/adwsauamyhedgt6aityf','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510411/polyhub_posts/adwsauamyhedgt6aityf.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0009809293467819725,_binary '\0',_binary '\0',NULL,NULL,NULL),(99,'Siuuuuuuuuuuuuuuu','2026-07-20 01:22:21.440414','polyhub_posts/n7eezzeg6odi3nr745q6','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510540/polyhub_posts/n7eezzeg6odi3nr745q6.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005605310553039842,_binary '\0',_binary '',NULL,NULL,NULL),(100,'được luôn','2026-07-20 01:24:22.999218',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,97,_binary '\0',NULL,0.0002335546063766601,_binary '\0',_binary '',NULL,NULL,NULL),(101,'Thời khắc cuối cùng hãy để 2H sáng hôm nay nói lên kết quả!!!','2026-07-20 01:26:35.843024','polyhub_posts/ujx1zndh1ve5urkaqv2v','http://res.cloudinary.com/dueb9a4d9/image/upload/v1784510795/polyhub_posts/ujx1zndh1ve5urkaqv2v.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0002335546063766601,_binary '\0',_binary '\0',NULL,NULL,NULL),(102,'hay quá ạ\n','2026-07-20 02:30:39.004067',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,99,_binary '\0',NULL,0.00023400973057027504,_binary '\0',_binary '\0',NULL,NULL,NULL),(103,'Xin chàoooo','2026-07-26 07:49:14.552131',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,98,_binary '\0',NULL,0.000323096760831372,_binary '\0',_binary '\0',NULL,NULL,NULL),(104,'Quaooooc4rctctc','2026-07-26 07:51:10.481418',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,91,_binary '\0',NULL,0.000323096760831372,_binary '\0',_binary '',NULL,NULL,NULL),(105,'Xin chào! 😊','2026-07-27 01:55:40.496850',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005402739385574582,_binary '\0',_binary '',NULL,NULL,NULL),(106,'Hello','2026-07-27 02:42:01.923014',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,95,_binary '\0',NULL,0.0005416206949762274,_binary '\0',_binary '',NULL,NULL,NULL),(107,'Rác','2026-07-27 03:09:00.719131',NULL,NULL,'TC00456',0,0,NULL,NULL,NULL,0,84,_binary '\0',NULL,0.00033935815992013486,_binary '\0',_binary '\0',NULL,NULL,NULL),(108,'Cặc','2026-08-01 15:15:40.394608',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0004922783545198402,_binary '\0',_binary '',NULL,NULL,NULL),(109,'cặc','2026-08-02 11:56:23.510111',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005255336059944417,_binary '\0',_binary '',NULL,NULL,NULL),(110,'cái đéo má tụi bây\r\n','2026-08-02 11:56:46.785257',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '',NULL,NULL,NULL),(111,'cái đéo má','2026-08-02 12:09:41.086635',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '',NULL,NULL,NULL),(112,'căc','2026-08-02 12:22:52.754519',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '','SAFE',NULL,'APPROVED'),(113,'chó thịnh nha','2026-08-02 12:25:59.338547',NULL,NULL,'TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '','SAFE',NULL,'APPROVED'),(114,'hello cả nhà','2026-08-02 12:38:26.607191','polyhub_posts/zelgytwdne8q3syvve7v','http://res.cloudinary.com/dueb9a4d9/image/upload/v1785674304/polyhub_posts/zelgytwdne8q3syvve7v.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '','SAFE',NULL,'APPROVED'),(115,'hello cả nhà','2026-08-02 12:43:07.123571','polyhub_posts/rbe2iahammt5h9t5xe08','http://res.cloudinary.com/dueb9a4d9/image/upload/v1785674585/polyhub_posts/rbe2iahammt5h9t5xe08.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005272941866758192,_binary '\0',_binary '','SAFE',NULL,'APPROVED'),(116,'hello các cậu','2026-08-03 01:54:42.538233','polyhub_posts/w4ggohflvibd9vemmsw5','http://res.cloudinary.com/dueb9a4d9/image/upload/v1785722080/polyhub_posts/w4ggohflvibd9vemmsw5.jpg','TC00523',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0005511072430866484,_binary '\0',_binary '\0','SAFE',NULL,'APPROVED'),(117,'pass lại 20$','2026-08-03 02:45:27.506100','polyhub_posts/wwjpolwwouxm8temwbqs','http://res.cloudinary.com/dueb9a4d9/image/upload/v1785725124/polyhub_posts/wwjpolwwouxm8temwbqs.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '',NULL,0.00055301308840705,_binary '\0',_binary '','SPAM','Nội dung có thể liên quan đến yêu cầu chuyển tiền','PENDING_REVIEW'),(118,'chào ạ','2026-08-14 01:35:44.692361','polyhub_posts/swznptiple5npgtrywpg','http://res.cloudinary.com/dueb9a4d9/image/upload/v1786671337/polyhub_posts/swznptiple5npgtrywpg.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0022360207979586913,_binary '\0',_binary '\0','SAFE',NULL,'APPROVED'),(119,'mai thúy','2026-08-14 06:03:28.617304',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.002337802788272087,_binary '\0',_binary '','SAFE',NULL,'APPROVED'),(120,'hello các bạn ','2026-08-14 07:09:04.927961',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.0023590877095803725,_binary '\0',_binary '\0','SAFE',NULL,'APPROVED'),(121,'má túy','2026-08-14 07:09:30.331139',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '',NULL,0.0023590877095803725,_binary '\0',_binary '\0','OFFENSIVE_LANGUAGE','Nội dung liên quan đến chất gây nghiện','PENDING_REVIEW'),(122,'hello ','2026-08-14 07:12:00.707017','polyhub_posts/fovegodcfxfy2hbkbxdx','http://res.cloudinary.com/dueb9a4d9/image/upload/v1786691518/polyhub_posts/fovegodcfxfy2hbkbxdx.jpg','TC00524',0,0,NULL,NULL,NULL,0,NULL,_binary '\0',NULL,0.006133628044908968,_binary '\0',_binary '\0','SAFE',NULL,'APPROVED'),(123,'test','2026-08-14 07:14:02.632817',NULL,NULL,'TC00524',0,0,NULL,NULL,NULL,0,122,_binary '\0',NULL,0.0033027227934125216,_binary '\0',_binary '\0',NULL,NULL,'APPROVED');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `available` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `price` double NOT NULL,
  `category_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKog2rp4qthbtt2lfyhfo32lsw9` (`category_id`),
  CONSTRAINT `FKog2rp4qthbtt2lfyhfo32lsw9` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `rating` int NOT NULL,
  `booking_id` bigint NOT NULL,
  `mentor_username` varchar(20) NOT NULL,
  `student_username` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK28an517hrxtt2bsg93uefugrm` (`booking_id`),
  KEY `FKa0696sdra2bf5b66h50hcbaq2` (`mentor_username`),
  KEY `FK8as2sqt1xmf6kga3r6cjgyb1i` (`student_username`),
  CONSTRAINT `FK28an517hrxtt2bsg93uefugrm` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
  CONSTRAINT `FK8as2sqt1xmf6kga3r6cjgyb1i` FOREIGN KEY (`student_username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKa0696sdra2bf5b66h50hcbaq2` FOREIGN KEY (`mentor_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,'thụ nginh','2026-08-03 03:06:23.634832',5,15,'TC00523','TC00524'),(2,'tốt ạ','2026-08-14 02:05:38.729820',5,17,'TC00523','TC00524'),(3,'tạm','2026-08-14 03:23:49.902512',3,19,'TC00523','TC00524'),(4,'hay ạ','2026-08-14 06:06:47.046303',4,20,'TC00523','TC00524');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` varchar(20) NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('ADMIN','ROLE_ADMIN'),('CLIENT','Khách hàng'),('CONTENT_ADMIN','Admin Nội dung'),('MENTOR','Giảng viên / Mentor'),('STUDENT','Sinh viên/Học viên'),('SUPER_ADMIN','Quản trị viên cấp cao'),('USER','ROLE_USER'),('USER_ADMIN','Admin Người dùng');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_documents`
--

DROP TABLE IF EXISTS `saved_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `saved_at` datetime(6) DEFAULT NULL,
  `document_id` bigint NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjcv5evuslvcy02i7byvmh9eq5` (`document_id`),
  KEY `FKkyx5yd38fai2c2qsxdbgys930` (`user_id`),
  CONSTRAINT `FKjcv5evuslvcy02i7byvmh9eq5` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`),
  CONSTRAINT `FKkyx5yd38fai2c2qsxdbgys930` FOREIGN KEY (`user_id`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_documents`
--

LOCK TABLES `saved_documents` WRITE;
/*!40000 ALTER TABLE `saved_documents` DISABLE KEYS */;
INSERT INTO `saved_documents` VALUES (1,'2026-04-18 13:07:24.788000',4,'TC00524'),(2,'2026-04-23 14:01:43.352000',10,'TC00456'),(3,'2026-06-27 01:18:46.046000',11,'TC00456'),(4,'2026-06-27 01:34:58.849000',11,'TC00523'),(5,'2026-06-27 03:03:14.325000',9,'TC00456'),(6,'2026-06-27 03:14:51.896000',10,'TC00523');
/*!40000 ALTER TABLE `saved_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `saved_posts`
--

DROP TABLE IF EXISTS `saved_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `saved_posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `saved_at` datetime(6) NOT NULL,
  `post_id` bigint NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9poxgdc1595vxdxkyg202x4ge` (`post_id`),
  KEY `FKs9a5ulcshnympbu557ps3qdlv` (`user_id`),
  CONSTRAINT `FK9poxgdc1595vxdxkyg202x4ge` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `FKs9a5ulcshnympbu557ps3qdlv` FOREIGN KEY (`user_id`) REFERENCES `users` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `saved_posts`
--

LOCK TABLES `saved_posts` WRITE;
/*!40000 ALTER TABLE `saved_posts` DISABLE KEYS */;
INSERT INTO `saved_posts` VALUES (5,'2026-04-23 14:01:53.962341',59,'TC00456'),(8,'2026-06-02 07:48:49.929344',63,'TC00456'),(15,'2026-06-20 01:52:18.003361',48,'TC00524'),(17,'2026-06-27 03:03:23.663912',79,'TC00456'),(18,'2026-06-27 03:15:06.248246',80,'TC00523'),(20,'2026-07-19 09:56:37.973598',84,'TC00524'),(21,'2026-07-19 09:57:39.331001',53,'TC00524'),(22,'2026-07-19 15:22:48.761403',94,'TC00524'),(24,'2026-07-20 02:30:32.204020',99,'TC00524'),(26,'2026-07-27 03:07:37.544972',103,'TC00523');
/*!40000 ALTER TABLE `saved_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `amount` bigint NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `tx_code` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,10000,'2026-08-20 01:25:33.918837','PENDING','NAP1787189133909','DEPOSIT','TC00123'),(2,10000,'2026-08-20 01:25:48.430606','PENDING','NAP1787189148430','DEPOSIT','TC00123'),(3,30000,'2026-08-21 00:57:47.410997','PENDING','NAP1787273867409','DEPOSIT','TC00523'),(4,10000,'2026-08-21 01:04:14.272167','SUCCESS','NAP1787274254244','DEPOSIT','TC00523'),(5,20000,'2026-08-21 02:03:50.309266','SUCCESS','NAP1787277830275','DEPOSIT','TC00523'),(6,10000,'2026-08-21 02:04:22.975448','SUCCESS','NAP1787277862975','DEPOSIT','TC00523');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_follows`
--

DROP TABLE IF EXISTS `user_follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_follows` (
  `user_username` varchar(20) NOT NULL,
  `follower_username` varchar(20) NOT NULL,
  PRIMARY KEY (`user_username`,`follower_username`),
  KEY `FKyuoa3wkgu3iwl8bp996ckt94` (`follower_username`),
  CONSTRAINT `FKlaewpevkunvhw4kplilcwc1pr` FOREIGN KEY (`user_username`) REFERENCES `users` (`username`),
  CONSTRAINT `FKyuoa3wkgu3iwl8bp996ckt94` FOREIGN KEY (`follower_username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_follows`
--

LOCK TABLES `user_follows` WRITE;
/*!40000 ALTER TABLE `user_follows` DISABLE KEYS */;
INSERT INTO `user_follows` VALUES ('TC00457','tc00125'),('TC00523','tc00125'),('TC00524','tc00125'),('TC00440','TC00456'),('TC00457','TC00523'),('TC00524','TC00523');
/*!40000 ALTER TABLE `user_follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(20) NOT NULL,
  `active` bit(1) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fullname` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `gender` bit(1) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role_id` varchar(20) DEFAULT NULL,
  `major` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `interested_categories` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `bio` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  `is_two_factor_enabled` bit(1) DEFAULT NULL,
  `two_factor_code` varchar(6) DEFAULT NULL,
  `two_factor_code_expire_time` datetime(6) DEFAULT NULL,
  `balance` bigint DEFAULT '0',
  `price_per_minute` bigint DEFAULT '1000',
  PRIMARY KEY (`username`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  KEY `FKp56c1712k691lhsyewcssf40f` (`role_id`),
  CONSTRAINT `FKp56c1712k691lhsyewcssf40f` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('admin',_binary '','default.png',NULL,'2026-06-02 07:44:55.185781','admin@polyhub.com','Super Admin',_binary '','$2a$10$bEfBXgN.jj3kdaQHB8OTpODEEkueHMULCQ0dJuMIEP6grD5UWnZw2',NULL,'ADMIN',NULL,NULL,NULL,'default-cover.jpg',NULL,NULL,NULL,NULL,0,1000),('demo_user',_binary '','default.png',NULL,'2026-04-09 15:04:21.650000','demo_user@fpt.edu.vn','Người dùng Demo',_binary '','123456',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1000),('TC00123',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1787278274/polyhub_avatars/pbfeop32n9c52wtdxe27.jpg','1999-04-25','2026-04-09 10:13:38.386000','Thinh@gmail.com','Trần Phong',_binary '','$2a$10$MmjCV61oRr8v1gkto4nzJum7F1uNDhEEOtd7LVeexdZQ1/XDpFMcW','0999999999','USER','Lập trình web',NULL,NULL,NULL,'Tôi là thịnh',NULL,NULL,NULL,98000,1000),('tc00125',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776910769/polyhub_avatars/mlruozlnbfczofs6g3af.jpg','2007-02-03','2026-04-09 10:31:19.654000','rr@gmail.com','Trần Lâm 1-6',_binary '','$2a$10$E7Pw1bItPYN.2QW/QNw/wONQUeJGeEhxBoTmC70.fos3c85pHwy2m','0755544244','CLIENT','Lập trình web',NULL,NULL,NULL,'Tôi là trần lâm',NULL,NULL,NULL,0,1000),('TC00440',_binary '\0','default.png','1999-04-10','2026-04-09 10:01:45.437000','mail@gmail.com','Nguyễn Bé Ba',_binary '','$2a$10$Tcdjh867MSlX.w/Sa4S6V.Hym5zpBmQqpbbvoSPXV9jSbNQVIWct.','0369010908','STUDENT',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1000),('TC00456',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776491177/polyhub_avatars/q2cmz17fbpv69ukawemu.jpg',NULL,'2026-04-18 09:20:08.066980','thinhhung1916@gmail.com','Nguyễn Hùng Thịnh1-8',_binary '','$2a$10$8jFZXyYxSsoElQYoflxR4eutZYfi5A2Lk4f0SBVlTEXWjq00iMF4G','0965390169','MENTOR','3',NULL,NULL,'default-cover.jpg','tôi là thịnh merci',NULL,NULL,NULL,0,1000),('TC00457',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776912579/polyhub_avatars/e7cye8psexh2obqwwzhn.jpg','2026-04-15','2026-04-18 14:14:01.561281','thinhnhtc00458@gmail.com','thinh nguyen',_binary '','$2a$10$5iBnbVBFUjrHNpOMR7HR.Ow5LwEL8ti2lIheaAXtLP3L8DOrhPVAW','0965390169','CONTENT_ADMIN',NULL,NULL,NULL,'default-cover.jpg','my name is thinh',NULL,NULL,NULL,0,1000),('TC00458',_binary '','default.png',NULL,'2026-04-08 11:05:17.922000','admin@gmail.com','Nguyễn Hùng Thịnh',_binary '','$2a$10$PWAjbi32m/WTujrescM0zulKfrMPA6zPg/CLDJG6GfAnElz.9nI3i',NULL,'STUDENT',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1000),('TC00523',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776491903/polyhub_avatars/vw1aejbvndpp4thyxxao.png','2026-04-29','2026-04-09 14:29:29.508000','nghianmtc00523@gmail.com','Nguyễn Minh Nghĩa',_binary '','$2a$10$7CfIOp3AJS8CiKO7kJIN2uL6xYO0Cyet/ySm2zLirOynzr.H4Gvu.','0987654323','MENTOR','Lập trình web',NULL,NULL,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1782526456/polyhub_documents/q3c0s0kvxm5sac9q7a7x.jpg','1-3',NULL,NULL,NULL,92000,1000),('TC00524',_binary '','http://res.cloudinary.com/dueb9a4d9/image/upload/v1776491463/polyhub_avatars/adz7tm00jkm4qhegsco7.jpg','1999-02-03','2026-04-10 20:47:46.852084','thinhhung@gmail.com','MNN 1-3',_binary '','$2a$10$fD5.lxpqFC5khD9uZwYlOec4hCn5d/2pDHJw8dS9mpClUu3t7rKJa','09999999111','MENTOR','Lập trình web',NULL,NULL,'http://res.cloudinary.com/dueb9a4d9/image/upload/v1776491475/polyhub_covers/xxykdilu1io90dygn16x.jpg','tôi là người sẽ cùng các bạn chinh phục con đường mới',NULL,NULL,NULL,0,1000);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitor_logs`
--

DROP TABLE IF EXISTS `visitor_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `visitor_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `access_date` date NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpvwjfxbwyc14mee8qihv7d9im` (`ip_address`,`access_date`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitor_logs`
--

LOCK TABLES `visitor_logs` WRITE;
/*!40000 ALTER TABLE `visitor_logs` DISABLE KEYS */;
INSERT INTO `visitor_logs` VALUES (2,'2026-06-05','0:0:0:0:0:0:0:1'),(3,'2026-06-07','0:0:0:0:0:0:0:1'),(4,'2026-06-08','0:0:0:0:0:0:0:1'),(5,'2026-06-19','0:0:0:0:0:0:0:1'),(6,'2026-06-20','0:0:0:0:0:0:0:1'),(8,'2026-06-24','0:0:0:0:0:0:0:1'),(11,'2026-06-27','0:0:0:0:0:0:0:1'),(12,'2026-07-01','0:0:0:0:0:0:0:1'),(13,'2026-07-04','0:0:0:0:0:0:0:1'),(15,'2026-07-10','0:0:0:0:0:0:0:1'),(16,'2026-07-15','0:0:0:0:0:0:0:1'),(17,'2026-07-19','0:0:0:0:0:0:0:1'),(21,'2026-07-20','0:0:0:0:0:0:0:1'),(25,'2026-07-26','0:0:0:0:0:0:0:1'),(27,'2026-07-27','0:0:0:0:0:0:0:1'),(36,'2026-08-02','0:0:0:0:0:0:0:1'),(39,'2026-08-14','0:0:0:0:0:0:0:1'),(43,'2026-08-17','0:0:0:0:0:0:0:1'),(44,'2026-08-18','0:0:0:0:0:0:0:1'),(46,'2026-08-19','0:0:0:0:0:0:0:1'),(47,'2026-08-20','0:0:0:0:0:0:0:1'),(49,'2026-08-21','0:0:0:0:0:0:0:1'),(29,'2026-07-27','113.161.210.31'),(1,'2026-06-05','127.0.0.1'),(7,'2026-06-20','127.0.0.1'),(18,'2026-07-19','127.0.0.1'),(22,'2026-07-20','127.0.0.1'),(45,'2026-08-18','127.0.0.1'),(48,'2026-08-20','127.0.0.1'),(32,'2026-07-27','14.241.166.117'),(30,'2026-07-27','14.241.183.136'),(31,'2026-07-27','172.16.32.114'),(33,'2026-07-27','172.16.32.160'),(38,'2026-08-03','172.16.32.21'),(23,'2026-07-20','172.16.34.245'),(24,'2026-07-20','172.16.35.77'),(14,'2026-07-04','172.16.36.185'),(9,'2026-06-27','172.16.42.21'),(10,'2026-06-27','172.16.42.3'),(42,'2026-08-14','172.16.45.131'),(41,'2026-08-14','172.16.45.138'),(37,'2026-08-03','172.16.47.184'),(34,'2026-08-01','192.168.1.15'),(35,'2026-08-02','192.168.1.16'),(28,'2026-07-27','192.168.1.20'),(26,'2026-07-26','192.168.1.24'),(40,'2026-08-14','192.168.1.36'),(20,'2026-07-19','192.168.1.37');
/*!40000 ALTER TABLE `visitor_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-21 10:12:38
