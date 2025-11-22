-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: databasegestordecobro
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ajustes_deuda`
--

DROP TABLE IF EXISTS `ajustes_deuda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ajustes_deuda` (
  `idAjuste` int NOT NULL AUTO_INCREMENT,
  `idDeuda` int NOT NULL,
  `Tasa_Ajuste` decimal(10,4) NOT NULL,
  `Tipo_ajuste` varchar(45) NOT NULL,
  `Monto_usd` decimal(10,4) NOT NULL,
  `Fecha_ajuste` date NOT NULL,
  `Descripcion` varchar(50) NOT NULL,
  PRIMARY KEY (`idAjuste`),
  KEY `idDeuda` (`idDeuda`),
  CONSTRAINT `ajustes_deuda_ibfk_1` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ajustes_deuda`
--

LOCK TABLES `ajustes_deuda` WRITE;
/*!40000 ALTER TABLE `ajustes_deuda` DISABLE KEYS */;
/*!40000 ALTER TABLE `ajustes_deuda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billetes_cash`
--

DROP TABLE IF EXISTS `billetes_cash`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billetes_cash` (
  `idBillete` int NOT NULL AUTO_INCREMENT,
  `idPago` int NOT NULL,
  `Codigo_Billete` varchar(25) NOT NULL,
  `Denominacion` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`idBillete`),
  KEY `idPago` (`idPago`),
  CONSTRAINT `billetes_cash_ibfk_1` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billetes_cash`
--

LOCK TABLES `billetes_cash` WRITE;
/*!40000 ALTER TABLE `billetes_cash` DISABLE KEYS */;
INSERT INTO `billetes_cash` VALUES (1,2,'12345',50.00),(2,2,'54321',10.00),(3,11,'22222',50.00),(4,11,'33333',10.00),(5,24,'33365',20.00),(6,24,'33456',10.00),(7,20,'223',20.00),(8,20,'224',10.00),(9,22,'555',20.00),(10,22,'322',10.00),(11,23,'12',20.00),(12,23,'13',10.00),(13,24,'22',20.00),(14,24,'10',10.00),(15,25,'20',20.00),(16,25,'112',10.00),(17,27,'202',20.00),(18,27,'1515',10.00),(19,28,'125',10.00),(20,31,'202',20.00),(21,31,'101',10.00);
/*!40000 ALTER TABLE `billetes_cash` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `control_mensualidades`
--

DROP TABLE IF EXISTS `control_mensualidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `control_mensualidades` (
  `idControl` int NOT NULL AUTO_INCREMENT,
  `idEstudiante` int NOT NULL,
  `idPago` int NOT NULL,
  `Mes` int NOT NULL,
  `Observacion` varchar(50) DEFAULT NULL,
  `idGrupo` int DEFAULT NULL,
  `Year` int DEFAULT NULL,
  `Mes_date` date DEFAULT NULL,
  PRIMARY KEY (`idControl`),
  UNIQUE KEY `unique_pago_mes` (`idEstudiante`,`Mes`),
  KEY `idPago` (`idPago`),
  KEY `idGrupo` (`idGrupo`),
  CONSTRAINT `control_mensualidades_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE,
  CONSTRAINT `control_mensualidades_ibfk_2` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE,
  CONSTRAINT `control_mensualidades_ibfk_3` FOREIGN KEY (`idGrupo`) REFERENCES `grupos` (`idGrupo`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `control_mensualidades`
--

LOCK TABLES `control_mensualidades` WRITE;
/*!40000 ALTER TABLE `control_mensualidades` DISABLE KEYS */;
INSERT INTO `control_mensualidades` VALUES (1,1,1,0,'Inscripción',1,NULL,NULL),(2,1,2,8,NULL,1,NULL,'2025-09-01'),(3,1,3,9,NULL,1,NULL,'2025-10-01'),(4,1,4,10,NULL,1,NULL,'2025-11-01'),(5,2,5,0,'Inscripción',1,NULL,NULL),(6,2,6,8,NULL,1,NULL,'2025-09-01'),(7,3,7,0,'Inscripción',2,NULL,NULL),(8,3,8,8,NULL,2,NULL,'2025-09-01'),(9,3,9,9,NULL,2,NULL,'2025-10-01'),(10,4,10,0,'Inscripción',3,NULL,NULL),(11,4,11,8,NULL,3,NULL,'2025-09-01'),(12,4,12,10,NULL,3,NULL,'2025-10-01'),(14,5,15,0,'Inscripción',3,NULL,NULL),(15,5,16,8,NULL,3,NULL,'2025-09-01'),(16,5,17,9,NULL,3,NULL,'2025-10-01'),(17,5,18,10,NULL,3,NULL,'2025-11-01'),(18,6,19,0,'Inscripción',4,NULL,NULL),(19,6,23,9,NULL,4,2025,'2025-09-01'),(20,7,27,11,NULL,6,2025,'2025-11-01'),(21,8,29,11,NULL,4,2025,'2025-11-01'),(22,9,31,11,NULL,7,2025,'2025-11-01');
/*!40000 ALTER TABLE `control_mensualidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuenta_destino`
--

DROP TABLE IF EXISTS `cuenta_destino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuenta_destino` (
  `idCuenta_Destino` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) NOT NULL,
  `Tipo` varchar(45) NOT NULL,
  `Moneda` varchar(45) NOT NULL,
  PRIMARY KEY (`idCuenta_Destino`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuenta_destino`
--

LOCK TABLES `cuenta_destino` WRITE;
/*!40000 ALTER TABLE `cuenta_destino` DISABLE KEYS */;
INSERT INTO `cuenta_destino` VALUES (1,'Caja Chica','Efectivo','Mixta'),(2,'Cuenta Débito','Banco','Bolívares');
/*!40000 ALTER TABLE `cuenta_destino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cursos`
--

DROP TABLE IF EXISTS `cursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cursos` (
  `idCurso` int NOT NULL AUTO_INCREMENT,
  `Nombre_Curso` varchar(50) NOT NULL,
  `Descripcion_Curso` varchar(50) NOT NULL,
  PRIMARY KEY (`idCurso`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cursos`
--

LOCK TABLES `cursos` WRITE;
/*!40000 ALTER TABLE `cursos` DISABLE KEYS */;
INSERT INTO `cursos` VALUES (1,'Dibujo Artístico','Curso de técnicas de dibujo y pintura'),(2,'Inglés','Curso de idioma inglés niveles básicos'),(3,'Francés','Curso de idioma francés intensivo'),(4,'Oratoria','Curso de expresión oral y liderazgo');
/*!40000 ALTER TABLE `cursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deudas`
--

DROP TABLE IF EXISTS `deudas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deudas` (
  `idDeuda` int NOT NULL AUTO_INCREMENT,
  `idEstudiante` int NOT NULL,
  `Monto_usd` decimal(10,4) NOT NULL,
  `Tasa_Emision` decimal(10,4) NOT NULL,
  `Monto_bs_emision` decimal(10,4) NOT NULL,
  `Fecha_emision` date NOT NULL,
  `Fecha_vencimiento` date NOT NULL,
  `Concepto` varchar(45) NOT NULL,
  `Estado` varchar(45) NOT NULL,
  PRIMARY KEY (`idDeuda`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `deudas_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deudas`
--

LOCK TABLES `deudas` WRITE;
/*!40000 ALTER TABLE `deudas` DISABLE KEYS */;
INSERT INTO `deudas` VALUES (1,1,10.0000,108.4500,1084.5000,'2025-09-01','2025-09-30','Inscripción','Pagada'),(2,1,30.0000,110.2200,3306.6000,'2025-09-05','2025-09-30','Mensualidad Septiembre','Pagada'),(3,1,30.0000,120.4500,3613.5000,'2025-10-05','2025-10-31','Mensualidad Octubre','Pagada'),(4,1,30.0000,128.9200,3867.6000,'2025-11-05','2025-11-30','Mensualidad Noviembre','Pagada'),(5,2,10.0000,108.4500,1084.5000,'2025-09-02','2025-09-30','Inscripción','Pagada'),(6,2,30.0000,111.6000,3348.0000,'2025-09-10','2025-09-30','Mensualidad Septiembre','Pagada'),(7,2,30.0000,118.7600,3562.8000,'2025-10-01','2025-09-30','Mensualidad Octubre','Pagada'),(8,2,30.0000,127.6200,3828.6000,'2025-11-01','2025-11-30','Mensualidad Noviembre','Pagada'),(9,3,10.0000,108.4500,1084.5000,'2025-09-01','2025-09-30','Inscripción','Pagada'),(10,3,30.0000,114.5600,3436.8000,'2025-09-15','2025-09-30','Mensualidad Septiembre','Pagada'),(11,3,30.0000,121.1300,3633.9000,'2025-10-10','2025-10-31','Mensualidad Octubre','Pendiente'),(12,3,30.0000,127.6200,3828.6000,'2025-11-01','2025-11-30','Mensualidad Noviembre','Pendiente'),(13,4,10.0000,108.4500,1084.5000,'2025-09-02','2025-09-30','Inscripción','Pagada'),(14,4,30.0000,116.4000,3492.0000,'2025-09-20','2025-09-30','Mensualidad Septiembre','Pagada'),(15,4,30.0000,118.7600,3562.8000,'2025-10-01','2025-10-31','Mensualidad Octubre','Pagada'),(16,4,30.0000,133.2100,3996.3000,'2025-11-15','2025-11-30','Mensualidad Noviembre','Pagada'),(17,5,10.0000,110.2200,1102.2000,'2025-09-05','2025-09-30','Inscripción','Pagada'),(18,5,30.0000,117.1100,3513.3000,'2025-09-25','2025-09-30','Mensualidad Septiembre','Pagada'),(19,5,30.0000,126.6600,3799.8000,'2025-10-25','2025-10-31','Mensualidad Octubre','Pagada'),(20,5,30.0000,135.0500,4051.5000,'2025-11-18','2025-11-30','Mensualidad Noviembre','Pagada'),(21,6,10.0000,110.2200,1102.2000,'2025-09-06','2025-09-30','Inscripción','Pagada'),(22,6,30.0000,108.4500,3253.5000,'2025-09-01','2025-09-30','Mensualidad Septiembre','Pagada'),(23,6,30.0000,118.7600,3562.8000,'2025-10-01','2025-09-30','Mensualidad Octubre','Pagada'),(24,6,30.0000,127.6200,3828.6000,'2025-11-01','2025-11-30','Mensualidad Noviembre','Pagada');
/*!40000 ALTER TABLE `deudas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiantes`
--

DROP TABLE IF EXISTS `estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiantes` (
  `idEstudiante` int NOT NULL AUTO_INCREMENT,
  `Nombres` varchar(45) NOT NULL,
  `Apellidos` varchar(45) NOT NULL,
  `Cedula` varchar(15) NOT NULL,
  `Fecha_Nacimiento` date NOT NULL,
  `Telefono` varchar(20) NOT NULL,
  `Correo` varchar(50) NOT NULL,
  `Direccion` varchar(100) NOT NULL,
  PRIMARY KEY (`idEstudiante`),
  UNIQUE KEY `Cedula` (`Cedula`),
  UNIQUE KEY `Correo` (`Correo`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiantes`
--

LOCK TABLES `estudiantes` WRITE;
/*!40000 ALTER TABLE `estudiantes` DISABLE KEYS */;
INSERT INTO `estudiantes` VALUES (1,'Luisito','Pérez','V-32000111','2012-05-15','0426-222222','luisito@mail.com','Av. Bolívar'),(2,'Sofía','Ruiz','V-33000222','2014-08-20','0424-1111111','sofia@mail.com','La Matica'),(3,'Pedrito','Gómez','V-31000333','2010-01-10','0416-0000000','pedro@mail.com','El Tambor'),(4,'Javier','Barrios','V-26498141','1998-10-12','0412-9998877','javierbarrios89@gmail.com','Los teques'),(5,'Gabriela','Amaro','V-25702452','1996-03-25','0414-5556677','gabrielaamarog21@gmail.com','Los teques'),(6,'Roberto','Mendoza','V-20555666','1990-07-30','0424-1112223','robert@mail.com','Los Lagos'),(7,'asfasfa','asdfasfeada','2365987','1988-02-02','5456454','asdfas@gmail.com','Los teques'),(8,'katy','gavidia','11818367','1987-03-15','04144596963','afadf@gmail.com','la cima'),(9,'jesus margarito','sirit','30457632','2004-04-24','24154647854','sirit@gmail.com','Tucasa');
/*!40000 ALTER TABLE `estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupos`
--

DROP TABLE IF EXISTS `grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos` (
  `idGrupo` int NOT NULL AUTO_INCREMENT,
  `idCurso` int NOT NULL,
  `Nombre_Grupo` varchar(50) NOT NULL,
  `Fecha_inicio` date NOT NULL,
  `Estado` varchar(50) NOT NULL,
  PRIMARY KEY (`idGrupo`),
  KEY `idCurso` (`idCurso`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos`
--

LOCK TABLES `grupos` WRITE;
/*!40000 ALTER TABLE `grupos` DISABLE KEYS */;
INSERT INTO `grupos` VALUES (1,1,'Dibujo - Mañana','2025-11-19','Activo'),(2,2,'Ingles - Tarde1','2025-09-05','Activo'),(3,3,'Frances - Sábado','2025-09-06','Activo'),(4,4,'Oratoria - Tarde','2025-09-20','Activo'),(5,2,'Ingles - Tarde2','2025-11-10','Activo'),(6,3,'Frances - Mañana1','2025-08-06','Activo'),(7,4,'Oratoria - Tarde2','2025-10-16','Activo');
/*!40000 ALTER TABLE `grupos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_estado_estudiante`
--

DROP TABLE IF EXISTS `historial_estado_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_estado_estudiante` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `idEstudiante` int NOT NULL,
  `Fecha_Cambio` date NOT NULL,
  `Estado` enum('Activo','Inactivo') NOT NULL,
  `Motivo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `historial_estado_estudiante_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_estado_estudiante`
--

LOCK TABLES `historial_estado_estudiante` WRITE;
/*!40000 ALTER TABLE `historial_estado_estudiante` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_estado_estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_tasa`
--

DROP TABLE IF EXISTS `historial_tasa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_tasa` (
  `idHistorial_Tasa` int NOT NULL AUTO_INCREMENT,
  `Tasa_Registrada` decimal(10,4) NOT NULL,
  `Fecha_Registro` date NOT NULL,
  PRIMARY KEY (`idHistorial_Tasa`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_tasa`
--

LOCK TABLES `historial_tasa` WRITE;
/*!40000 ALTER TABLE `historial_tasa` DISABLE KEYS */;
INSERT INTO `historial_tasa` VALUES (1,100.0000,'2025-08-01'),(2,101.5700,'2025-08-05'),(3,102.4200,'2025-08-09'),(4,103.1900,'2025-08-13'),(5,104.4800,'2025-08-17'),(6,106.3400,'2025-08-21'),(7,106.8700,'2025-08-25'),(8,108.4500,'2025-08-29'),(9,110.2200,'2025-09-02'),(10,111.6000,'2025-09-06'),(11,112.9200,'2025-09-10'),(12,114.5600,'2025-09-14'),(13,116.4000,'2025-09-18'),(14,117.1100,'2025-09-22'),(15,117.6800,'2025-09-26'),(16,118.7600,'2025-09-30'),(17,120.4500,'2025-10-04'),(18,121.1300,'2025-10-08'),(19,122.5500,'2025-10-12'),(20,123.1000,'2025-10-16'),(21,124.9700,'2025-10-20'),(22,126.6600,'2025-10-24'),(23,127.6200,'2025-10-28'),(24,128.9200,'2025-11-01'),(25,130.3100,'2025-11-05'),(26,131.8500,'2025-11-09'),(27,133.2100,'2025-11-13'),(28,135.0500,'2025-11-17'),(29,136.3100,'2025-11-21'),(30,138.2600,'2025-11-25');
/*!40000 ALTER TABLE `historial_tasa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `idEstudiante` int NOT NULL,
  `idCurso` int NOT NULL,
  `Fecha_inscripcion` date NOT NULL,
  `idGrupo` int DEFAULT NULL,
  PRIMARY KEY (`idEstudiante`,`idCurso`),
  KEY `idCurso` (`idCurso`),
  KEY `idGrupo` (`idGrupo`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`),
  CONSTRAINT `inscripciones_ibfk_3` FOREIGN KEY (`idGrupo`) REFERENCES `grupos` (`idGrupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (1,1,'2025-09-01',1),(1,2,'2025-09-01',2),(2,1,'2025-09-03',1),(3,2,'2025-09-04',2),(4,3,'2025-09-02',3),(4,4,'2025-09-02',4),(5,3,'2025-09-05',3),(6,4,'2025-09-06',4),(7,3,'2025-11-22',6),(7,4,'2025-11-22',7),(8,4,'2025-11-22',4),(9,4,'2025-11-22',7);
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metodos_pagos`
--

DROP TABLE IF EXISTS `metodos_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodos_pagos` (
  `idMetodos_pago` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) NOT NULL,
  `Tipo_Validacion` varchar(45) NOT NULL,
  `Moneda_asociada` varchar(45) NOT NULL,
  PRIMARY KEY (`idMetodos_pago`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metodos_pagos`
--

LOCK TABLES `metodos_pagos` WRITE;
/*!40000 ALTER TABLE `metodos_pagos` DISABLE KEYS */;
INSERT INTO `metodos_pagos` VALUES (1,'Transferencia','Número de referencia','Bolívares'),(2,'Pago Móvil','Número de referencia','Bolívares'),(3,'Efectivo','Sin validación','Bolívares'),(4,'Cash','Códigos de billetes','Dólares');
/*!40000 ALTER TABLE `metodos_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `idPago` int NOT NULL AUTO_INCREMENT,
  `idDeuda` int DEFAULT NULL,
  `idMetodos_pago` int NOT NULL,
  `idCuenta_Destino` int NOT NULL,
  `idEstudiante` int NOT NULL,
  `Referencia` varchar(20) NOT NULL,
  `observacion` varchar(255) DEFAULT NULL,
  `Monto_bs` decimal(10,4) NOT NULL,
  `Tasa_Pago` decimal(10,4) NOT NULL,
  `Monto_usd` decimal(10,4) NOT NULL,
  `Fecha_pago` date NOT NULL,
  PRIMARY KEY (`idPago`),
  KEY `idDeuda` (`idDeuda`),
  KEY `idMetodos_pago` (`idMetodos_pago`),
  KEY `idCuenta_Destino` (`idCuenta_Destino`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`idMetodos_pago`) REFERENCES `metodos_pagos` (`idMetodos_pago`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`idCuenta_Destino`) REFERENCES `cuenta_destino` (`idCuenta_Destino`),
  CONSTRAINT `pagos_ibfk_4` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,1,4,1,1,'REF-INS-LUI',NULL,1084.5000,108.4500,10.0000,'2025-09-01'),(2,2,1,2,1,'REF-123456',NULL,3306.6000,110.2200,30.0000,'2025-09-05'),(3,3,1,2,1,'REF-123457',NULL,3613.5000,120.4500,30.0000,'2025-10-05'),(4,4,1,2,1,'REF-123458',NULL,3867.6000,128.9200,30.0000,'2025-11-05'),(5,5,2,2,2,'PM-INS-SOF',NULL,1084.5000,108.4500,10.0000,'2025-09-02'),(6,6,2,2,2,'PM-002',NULL,3348.0000,111.6000,30.0000,'2025-09-10'),(7,9,1,2,3,'TR-INS-PED',NULL,1084.5000,108.4500,10.0000,'2025-09-01'),(8,10,1,2,3,'TR-PED-2',NULL,3436.8000,114.5600,30.0000,'2025-09-15'),(9,11,4,1,3,'Pendiente',NULL,1816.9500,121.1300,15.0000,'2025-10-10'),(10,13,1,2,4,'TR-INS-JAV',NULL,1084.5000,108.4500,10.0000,'2025-09-02'),(11,14,1,2,4,'TR-JAV-2',NULL,3492.0000,116.4000,30.0000,'2025-09-20'),(12,15,4,1,4,'Pendiente',NULL,1806.7500,120.4500,15.0000,'2025-10-05'),(13,15,4,1,4,'Pendiente',NULL,1846.5000,123.1000,15.0000,'2025-10-20'),(14,16,1,2,4,'TR-JAV-3',NULL,3996.3000,133.2100,30.0000,'2025-11-15'),(15,17,3,1,5,'Pendiente',NULL,1102.2000,110.2200,10.0000,'2025-09-05'),(16,18,3,1,5,'Pendiente',NULL,3513.3000,117.1100,30.0000,'2025-09-25'),(17,19,3,1,5,'Pendiente',NULL,3799.8000,126.6600,30.0000,'2025-10-25'),(18,20,3,1,5,'Pendiente',NULL,4051.5000,135.0500,30.0000,'2025-11-18'),(19,21,4,1,6,'CASH-ROB',NULL,1102.2000,110.2200,10.0000,'2025-09-06'),(20,7,4,1,2,'223, 224',NULL,4147.8000,138.2600,30.0000,'2025-11-22'),(21,8,2,2,2,'2151',NULL,4148.0000,138.2600,30.0014,'2025-11-22'),(22,22,4,1,6,'555, 322',NULL,4147.8000,138.2600,30.0000,'2025-11-22'),(23,NULL,4,1,6,'12, 13','Mensualidad 2025-09',4147.8000,138.2600,30.0000,'2025-11-22'),(24,24,4,1,6,'22, 10',NULL,4147.8000,138.2600,30.0000,'2025-11-22'),(25,23,4,1,6,'20, 112',NULL,4147.8000,138.2600,30.0000,'2025-11-22'),(26,NULL,1,2,7,'222336','Inscripción (Frances - Mañana1, Oratoria - Tarde2)',1382.0000,138.2600,9.9957,'2025-11-22'),(27,NULL,4,1,7,'202, 1515','Mensualidad 2025-11',4147.8000,138.2600,30.0000,'2025-11-22'),(28,NULL,4,1,8,'125','Inscripción (Oratoria - Tarde)',1382.6000,138.2600,10.0000,'2025-11-22'),(29,NULL,2,2,8,'23655','Mensualidad 2025-11',4148.0000,138.2600,30.0014,'2025-11-22'),(30,NULL,2,2,9,'653','Inscripción (Oratoria - Tarde2)',1382.0000,138.2600,9.9957,'2025-11-22'),(31,NULL,4,1,9,'202, 101','Mensualidad 2025-11',4147.8000,138.2600,30.0000,'2025-11-22');
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_parciales`
--

DROP TABLE IF EXISTS `pagos_parciales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_parciales` (
  `idPagos_Parciales` int NOT NULL AUTO_INCREMENT,
  `idPago` int NOT NULL,
  `idDeuda` int NOT NULL,
  `Monto_parcial` decimal(10,4) NOT NULL,
  PRIMARY KEY (`idPagos_Parciales`),
  KEY `idPago` (`idPago`),
  KEY `idDeuda` (`idDeuda`),
  CONSTRAINT `pagos_parciales_ibfk_1` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE,
  CONSTRAINT `pagos_parciales_ibfk_2` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_parciales`
--

LOCK TABLES `pagos_parciales` WRITE;
/*!40000 ALTER TABLE `pagos_parciales` DISABLE KEYS */;
INSERT INTO `pagos_parciales` VALUES (1,9,11,15.0000),(2,12,15,15.0000),(3,13,15,15.0000),(4,20,7,30.0000),(5,21,8,30.0014),(6,22,22,30.0000),(7,24,24,30.0000),(8,25,23,30.0000);
/*!40000 ALTER TABLE `pagos_parciales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representante_estudiante`
--

DROP TABLE IF EXISTS `representante_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representante_estudiante` (
  `idRepresentante` int NOT NULL,
  `idEstudiante` int NOT NULL,
  PRIMARY KEY (`idRepresentante`,`idEstudiante`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `representante_estudiante_ibfk_1` FOREIGN KEY (`idRepresentante`) REFERENCES `representantes` (`idRepresentante`) ON DELETE CASCADE,
  CONSTRAINT `representante_estudiante_ibfk_2` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representante_estudiante`
--

LOCK TABLES `representante_estudiante` WRITE;
/*!40000 ALTER TABLE `representante_estudiante` DISABLE KEYS */;
INSERT INTO `representante_estudiante` VALUES (1,1),(2,2),(3,3);
/*!40000 ALTER TABLE `representante_estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representantes`
--

DROP TABLE IF EXISTS `representantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representantes` (
  `idRepresentante` int NOT NULL AUTO_INCREMENT,
  `Nombres` varchar(50) NOT NULL,
  `Apellidos` varchar(50) NOT NULL,
  `Cedula` varchar(15) NOT NULL,
  `Parentesco` varchar(50) NOT NULL,
  `Correo` varchar(50) DEFAULT NULL,
  `Direccion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idRepresentante`),
  UNIQUE KEY `Cedula` (`Cedula`),
  UNIQUE KEY `Correo` (`Correo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representantes`
--

LOCK TABLES `representantes` WRITE;
/*!40000 ALTER TABLE `representantes` DISABLE KEYS */;
INSERT INTO `representantes` VALUES (1,'María','Pérez','V-12345678','Madre','maria@mail.com','Av. Bolívar, Los Teques'),(2,'Carlos','Ruiz','V-87654321','Padre','carlos@mail.com','La Matica'),(3,'Ana','Gómez','V-11223344','Tía','ana@mail.com','El Tambor');
/*!40000 ALTER TABLE `representantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `Nombre_Rol` varchar(50) NOT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `Nombre_Rol` (`Nombre_Rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador'),(2,'Gestor');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_pago`
--

DROP TABLE IF EXISTS `solicitudes_pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes_pago` (
  `idSolicitud` int NOT NULL AUTO_INCREMENT,
  `idEstudiante` int NOT NULL,
  `Tipo_Solicitud` enum('WhatsApp','Email','Llamada') NOT NULL,
  `Fecha_Solicitud` date NOT NULL,
  `Notas` text,
  `Fecha_Registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idSolicitud`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `solicitudes_pago_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_pago`
--

LOCK TABLES `solicitudes_pago` WRITE;
/*!40000 ALTER TABLE `solicitudes_pago` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_pago` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasa_cambio`
--

DROP TABLE IF EXISTS `tasa_cambio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasa_cambio` (
  `idTasa` int NOT NULL AUTO_INCREMENT,
  `Fecha_Vigencia` date NOT NULL,
  `Tasa_usd_a_bs` decimal(10,4) NOT NULL,
  PRIMARY KEY (`idTasa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasa_cambio`
--

LOCK TABLES `tasa_cambio` WRITE;
/*!40000 ALTER TABLE `tasa_cambio` DISABLE KEYS */;
INSERT INTO `tasa_cambio` VALUES (1,'2025-11-21',138.2600);
/*!40000 ALTER TABLE `tasa_cambio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `telefonos_representante`
--

DROP TABLE IF EXISTS `telefonos_representante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `telefonos_representante` (
  `idTelefonos_Representante` int NOT NULL AUTO_INCREMENT,
  `idRepresentante` int NOT NULL,
  `Numero` varchar(20) NOT NULL,
  `Tipo` varchar(10) NOT NULL,
  PRIMARY KEY (`idTelefonos_Representante`),
  KEY `idRepresentante` (`idRepresentante`),
  CONSTRAINT `telefonos_representante_ibfk_1` FOREIGN KEY (`idRepresentante`) REFERENCES `representantes` (`idRepresentante`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telefonos_representante`
--

LOCK TABLES `telefonos_representante` WRITE;
/*!40000 ALTER TABLE `telefonos_representante` DISABLE KEYS */;
INSERT INTO `telefonos_representante` VALUES (1,1,'0414-1112233','Móvil'),(2,2,'0412-4445566','Móvil'),(3,3,'0212-3210000','Casa');
/*!40000 ALTER TABLE `telefonos_representante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `idRol` int NOT NULL,
  `Nombre_Usuario` varchar(50) NOT NULL,
  `Clave` varchar(255) NOT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `Nombre_Usuario` (`Nombre_Usuario`),
  KEY `idRol` (`idRol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'Admin','admin098');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-22  0:54:32
