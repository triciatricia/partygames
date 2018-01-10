-- MySQL dump 10.13  Distrib 5.7.16, for osx10.11 (x86_64)
--
-- Host: localhost    Database: myreactionwhen
-- ------------------------------------------------------
-- Server version	5.7.16

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `myreactionwhen`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `myreactionwhen` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `myreactionwhen`;

--
-- Table structure for table `gameimage`
--

DROP TABLE IF EXISTS `gameimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gameimage` (
  `gameId` bigint(20) unsigned NOT NULL,
  `gameImageId` bigint(20) unsigned NOT NULL,
  `imageUrl` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wasSkipped` tinyint(1) DEFAULT NULL,
  `scenario` text COLLATE utf8mb4_unicode_ci,
  `reactorNickname` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`gameId`,`gameImageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `games` (
  `id` bigint(20) unsigned NOT NULL,
  `round` bigint(20) unsigned DEFAULT NULL,
  `image` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waitingForScenarios` tinyint(1) DEFAULT NULL,
  `reactorID` bigint(20) unsigned DEFAULT NULL,
  `reactorNickname` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hostID` bigint(20) unsigned DEFAULT NULL,
  `gameOver` tinyint(1) DEFAULT NULL,
  `winningResponse` bigint(20) unsigned DEFAULT NULL,
  `winningResponseSubmittedBy` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastGif` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayOrder` mediumtext COLLATE utf8mb4_unicode_ci,
  `imageQueue` mediumtext COLLATE utf8mb4_unicode_ci,
  `roundStarted` bigint(20) unsigned DEFAULT NULL,
  `firstImageID` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `images` (
  `url` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nSkipped` bigint(20) unsigned DEFAULT '0',
  `nHearted` bigint(20) unsigned DEFAULT '0',
  PRIMARY KEY (`url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usergame`
--

DROP TABLE IF EXISTS `usergame`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usergame` (
  `user` bigint(20) unsigned DEFAULT NULL,
  `game` bigint(20) unsigned DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nickname` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accessToken` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `roundOfLastResponse` bigint(20) unsigned DEFAULT NULL,
  `response` mediumtext COLLATE utf8mb4_unicode_ci,
  `score` bigint(20) DEFAULT '0',
  `game` bigint(20) unsigned DEFAULT NULL,
  `submittedScenario` tinyint(1) DEFAULT NULL,
  `lastActiveTime` bigint(20) unsigned DEFAULT NULL,
  `ExpoPushToken` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-01-09 23:00:19
