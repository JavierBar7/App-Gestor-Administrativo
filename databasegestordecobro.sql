CREATE DATABASE  IF NOT EXISTS `databasegestordecobro` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci */;
USE `databasegestordecobro`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: databasegestordecobro
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

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
  `idAjuste` int(11) NOT NULL AUTO_INCREMENT,
  `idDeuda` int(11) NOT NULL,
  `Tasa_Ajuste` decimal(10,4) NOT NULL,
  `Tipo_ajuste` varchar(45) NOT NULL,
  `Monto_usd` decimal(10,4) NOT NULL,
  `Fecha_ajuste` date NOT NULL,
  `Descripcion` varchar(50) NOT NULL,
  PRIMARY KEY (`idAjuste`),
  KEY `idDeuda` (`idDeuda`),
  CONSTRAINT `ajustes_deuda_ibfk_1` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
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
  `idBillete` int(11) NOT NULL AUTO_INCREMENT,
  `idPago` int(11) NOT NULL,
  `Codigo_Billete` varchar(25) NOT NULL,
  `Denominacion` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`idBillete`),
  KEY `idPago` (`idPago`),
  CONSTRAINT `billetes_cash_ibfk_1` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billetes_cash`
--

LOCK TABLES `billetes_cash` WRITE;
/*!40000 ALTER TABLE `billetes_cash` DISABLE KEYS */;
/*!40000 ALTER TABLE `billetes_cash` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `control_mensualidades`
--

DROP TABLE IF EXISTS `control_mensualidades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `control_mensualidades` (
  `idControl` int(11) NOT NULL AUTO_INCREMENT,
  `idEstudiante` int(11) NOT NULL,
  `idPago` int(11) NOT NULL,
  `Mes` int(11) NOT NULL,
  `Observacion` varchar(50) DEFAULT NULL,
  `idGrupo` int(11) DEFAULT NULL,
  `Year` int(11) DEFAULT NULL,
  `Mes_date` date DEFAULT NULL,
  PRIMARY KEY (`idControl`),
  UNIQUE KEY `unique_pago_mes` (`idEstudiante`,`Mes`),
  KEY `idPago` (`idPago`),
  KEY `idGrupo` (`idGrupo`),
  CONSTRAINT `control_mensualidades_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE,
  CONSTRAINT `control_mensualidades_ibfk_2` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE,
  CONSTRAINT `control_mensualidades_ibfk_3` FOREIGN KEY (`idGrupo`) REFERENCES `grupos` (`idGrupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `control_mensualidades`
--

LOCK TABLES `control_mensualidades` WRITE;
/*!40000 ALTER TABLE `control_mensualidades` DISABLE KEYS */;
/*!40000 ALTER TABLE `control_mensualidades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuenta_destino`
--

DROP TABLE IF EXISTS `cuenta_destino`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuenta_destino` (
  `idCuenta_Destino` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) NOT NULL,
  `Tipo` varchar(45) NOT NULL,
  `Moneda` varchar(45) NOT NULL,
  PRIMARY KEY (`idCuenta_Destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuenta_destino`
--

LOCK TABLES `cuenta_destino` WRITE;
/*!40000 ALTER TABLE `cuenta_destino` DISABLE KEYS */;
/*!40000 ALTER TABLE `cuenta_destino` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cursos`
--

DROP TABLE IF EXISTS `cursos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cursos` (
  `idCurso` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre_Curso` varchar(50) NOT NULL,
  `Descripcion_Curso` varchar(50) NOT NULL,
  PRIMARY KEY (`idCurso`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cursos`
--

LOCK TABLES `cursos` WRITE;
/*!40000 ALTER TABLE `cursos` DISABLE KEYS */;
INSERT INTO `cursos` VALUES (1,'T1','primero grupo de prueba');
/*!40000 ALTER TABLE `cursos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deudas`
--

DROP TABLE IF EXISTS `deudas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deudas` (
  `idDeuda` int(11) NOT NULL AUTO_INCREMENT,
  `idEstudiante` int(11) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deudas`
--

LOCK TABLES `deudas` WRITE;
/*!40000 ALTER TABLE `deudas` DISABLE KEYS */;
/*!40000 ALTER TABLE `deudas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estudiantes`
--

DROP TABLE IF EXISTS `estudiantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estudiantes` (
  `idEstudiante` int(11) NOT NULL AUTO_INCREMENT,
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estudiantes`
--

LOCK TABLES `estudiantes` WRITE;
/*!40000 ALTER TABLE `estudiantes` DISABLE KEYS */;
INSERT INTO `estudiantes` VALUES (1,'Jose Jose','Martinez Martinez','1234567','2004-10-10','04141111111','johndoe147@gmail.com','Tu casa'),(2,'Jose','Martinez','1478526','2000-10-20','04241236985','kjnjwe@gmail.com','tu casa'),(3,'Jose','martinez','154','2000-10-20','05650','wee@gmail.com','eduiebduew'),(4,'Jose','Martinez','147856321','2000-10-20','04123216549','josemar@gmail.com','Tu casa');
/*!40000 ALTER TABLE `estudiantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupos`
--

DROP TABLE IF EXISTS `grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos` (
  `idGrupo` int(11) NOT NULL AUTO_INCREMENT,
  `idCurso` int(11) NOT NULL,
  `Nombre_Grupo` varchar(50) NOT NULL,
  `Fecha_inicio` date NOT NULL,
  `Estado` varchar(50) NOT NULL,
  PRIMARY KEY (`idGrupo`),
  KEY `idCurso` (`idCurso`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos`
--

LOCK TABLES `grupos` WRITE;
/*!40000 ALTER TABLE `grupos` DISABLE KEYS */;
INSERT INTO `grupos` VALUES (1,1,'T1','2025-11-18','Activo');
/*!40000 ALTER TABLE `grupos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_estado_estudiante`
--

DROP TABLE IF EXISTS `historial_estado_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_estado_estudiante` (
  `idHistorial` int(11) NOT NULL AUTO_INCREMENT,
  `idEstudiante` int(11) NOT NULL,
  `Fecha_Cambio` date NOT NULL,
  `Estado` enum('Activo','Inactivo') NOT NULL,
  `Motivo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `historial_estado_estudiante_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
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
  `idHistorial_Tasa` int(11) NOT NULL AUTO_INCREMENT,
  `Tasa_Registrada` decimal(10,4) NOT NULL,
  `Fecha_Registro` date NOT NULL,
  PRIMARY KEY (`idHistorial_Tasa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_tasa`
--

LOCK TABLES `historial_tasa` WRITE;
/*!40000 ALTER TABLE `historial_tasa` DISABLE KEYS */;
/*!40000 ALTER TABLE `historial_tasa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `idEstudiante` int(11) NOT NULL,
  `idCurso` int(11) NOT NULL,
  `Fecha_inscripcion` date NOT NULL,
  `idGrupo` int(11) DEFAULT NULL,
  PRIMARY KEY (`idEstudiante`,`idCurso`),
  KEY `idCurso` (`idCurso`),
  KEY `idGrupo` (`idGrupo`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`),
  CONSTRAINT `inscripciones_ibfk_3` FOREIGN KEY (`idGrupo`) REFERENCES `grupos` (`idGrupo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
INSERT INTO `inscripciones` VALUES (4,1,'2025-11-19',1);
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metodos_pagos`
--

DROP TABLE IF EXISTS `metodos_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metodos_pagos` (
  `idMetodos_pago` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) NOT NULL,
  `Tipo_Validacion` varchar(45) NOT NULL,
  `Moneda_asociada` varchar(45) NOT NULL,
  PRIMARY KEY (`idMetodos_pago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metodos_pagos`
--

LOCK TABLES `metodos_pagos` WRITE;
/*!40000 ALTER TABLE `metodos_pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `metodos_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos` (
  `idPago` int(11) NOT NULL AUTO_INCREMENT,
  `idDeuda` int(11) NOT NULL,
  `idMetodos_pago` int(11) NOT NULL,
  `idCuenta_Destino` int(11) NOT NULL,
  `idEstudiante` int(11) NOT NULL,
  `Referencia` varchar(20) NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_parciales`
--

DROP TABLE IF EXISTS `pagos_parciales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_parciales` (
  `idPagos_Parciales` int(11) NOT NULL AUTO_INCREMENT,
  `idPago` int(11) NOT NULL,
  `idDeuda` int(11) NOT NULL,
  `Monto_parcial` decimal(10,4) NOT NULL,
  PRIMARY KEY (`idPagos_Parciales`),
  KEY `idPago` (`idPago`),
  KEY `idDeuda` (`idDeuda`),
  CONSTRAINT `pagos_parciales_ibfk_1` FOREIGN KEY (`idPago`) REFERENCES `pagos` (`idPago`) ON DELETE CASCADE,
  CONSTRAINT `pagos_parciales_ibfk_2` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_parciales`
--

LOCK TABLES `pagos_parciales` WRITE;
/*!40000 ALTER TABLE `pagos_parciales` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos_parciales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representante_estudiante`
--

DROP TABLE IF EXISTS `representante_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representante_estudiante` (
  `idRepresentante` int(11) NOT NULL,
  `idEstudiante` int(11) NOT NULL,
  PRIMARY KEY (`idRepresentante`,`idEstudiante`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `representante_estudiante_ibfk_1` FOREIGN KEY (`idRepresentante`) REFERENCES `representantes` (`idRepresentante`) ON DELETE CASCADE,
  CONSTRAINT `representante_estudiante_ibfk_2` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representante_estudiante`
--

LOCK TABLES `representante_estudiante` WRITE;
/*!40000 ALTER TABLE `representante_estudiante` DISABLE KEYS */;
/*!40000 ALTER TABLE `representante_estudiante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `representantes`
--

DROP TABLE IF EXISTS `representantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representantes` (
  `idRepresentante` int(11) NOT NULL AUTO_INCREMENT,
  `Nombres` varchar(50) NOT NULL,
  `Apellidos` varchar(50) NOT NULL,
  `Cedula` varchar(15) NOT NULL,
  `Parentesco` varchar(50) NOT NULL,
  `Correo` varchar(50) DEFAULT NULL,
  `Direccion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idRepresentante`),
  UNIQUE KEY `Cedula` (`Cedula`),
  UNIQUE KEY `Correo` (`Correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `representantes`
--

LOCK TABLES `representantes` WRITE;
/*!40000 ALTER TABLE `representantes` DISABLE KEYS */;
/*!40000 ALTER TABLE `representantes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `idRol` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre_Rol` varchar(50) NOT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `Nombre_Rol` (`Nombre_Rol`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
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
-- Table structure for table `tasa_cambio`
--

DROP TABLE IF EXISTS `tasa_cambio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasa_cambio` (
  `idTasa` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha_Vigencia` date NOT NULL,
  `Tasa_usd_a_bs` decimal(10,4) NOT NULL,
  PRIMARY KEY (`idTasa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasa_cambio`
--

LOCK TABLES `tasa_cambio` WRITE;
/*!40000 ALTER TABLE `tasa_cambio` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasa_cambio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `telefonos_representante`
--

DROP TABLE IF EXISTS `telefonos_representante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `telefonos_representante` (
  `idTelefonos_Representante` int(11) NOT NULL AUTO_INCREMENT,
  `idRepresentante` int(11) NOT NULL,
  `Numero` varchar(20) NOT NULL,
  `Tipo` varchar(10) NOT NULL,
  PRIMARY KEY (`idTelefonos_Representante`),
  KEY `idRepresentante` (`idRepresentante`),
  CONSTRAINT `telefonos_representante_ibfk_1` FOREIGN KEY (`idRepresentante`) REFERENCES `representantes` (`idRepresentante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telefonos_representante`
--

LOCK TABLES `telefonos_representante` WRITE;
/*!40000 ALTER TABLE `telefonos_representante` DISABLE KEYS */;
/*!40000 ALTER TABLE `telefonos_representante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idUsuario` int(11) NOT NULL AUTO_INCREMENT,
  `idRol` int(11) NOT NULL,
  `Nombre_Usuario` varchar(50) NOT NULL,
  `Clave` varchar(255) NOT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `Nombre_Usuario` (`Nombre_Usuario`),
  KEY `idRol` (`idRol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `roles` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'Admin','admin098');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
