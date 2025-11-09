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
  `Fecha_ajuste` datetime NOT NULL,
  `Descripcion` varchar(45) NOT NULL,
  PRIMARY KEY (`idAjuste`),
  KEY `idDeuda` (`idDeuda`),
  CONSTRAINT `ajustes_deuda_ibfk_1` FOREIGN KEY (`idDeuda`) REFERENCES `deudas` (`idDeuda`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `Fecha_emision` datetime NOT NULL,
  `Fecha_vencimiento` datetime NOT NULL,
  `Concepto` varchar(45) NOT NULL,
  `Estado` varchar(45) NOT NULL,
  PRIMARY KEY (`idDeuda`),
  KEY `idEstudiante` (`idEstudiante`),
  CONSTRAINT `deudas_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `Correo` varchar(45) NOT NULL,
  `Direccion` varchar(100) NOT NULL,
  PRIMARY KEY (`idEstudiante`),
  UNIQUE KEY `Cedula` (`Cedula`),
  UNIQUE KEY `Correo` (`Correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `Fecha_inicio` datetime NOT NULL,
  `Estado` varchar(50) NOT NULL,
  PRIMARY KEY (`idGrupo`),
  KEY `idCurso` (`idCurso`),
  CONSTRAINT `grupos_ibfk_1` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historial_tasa`
--

DROP TABLE IF EXISTS `historial_tasa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_tasa` (
  `idHistorial_Tasa` int(11) NOT NULL AUTO_INCREMENT,
  `Tasa_Registrada` decimal(10,4) NOT NULL,
  `Fecha_Registro` datetime NOT NULL,
  PRIMARY KEY (`idHistorial_Tasa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  PRIMARY KEY (`idEstudiante`,`idCurso`),
  KEY `idCurso` (`idCurso`),
  CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`idEstudiante`) REFERENCES `estudiantes` (`idEstudiante`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`idCurso`) REFERENCES `cursos` (`idCurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `Referencia` varchar(45) NOT NULL,
  `Monto_bs` decimal(10,4) NOT NULL,
  `Tasa_Pago` decimal(10,4) NOT NULL,
  `Monto_usd` decimal(10,4) NOT NULL,
  `Fecha_pago` datetime NOT NULL,
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
-- Table structure for table `representantes`
--

DROP TABLE IF EXISTS `representantes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `representantes` (
  `idRepresentante` int(11) NOT NULL AUTO_INCREMENT,
  `Nombres` varchar(50) NOT NULL,
  `Apellidos` varchar(50) NOT NULL,
  `Cedula` varchar(50) NOT NULL,
  `Parentesco` varchar(50) NOT NULL,
  `Correo` varchar(100) DEFAULT NULL,
  `Direccion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idRepresentante`),
  UNIQUE KEY `Cedula` (`Cedula`),
  UNIQUE KEY `Correo` (`Correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasa_cambio`
--

DROP TABLE IF EXISTS `tasa_cambio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasa_cambio` (
  `idTasa` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha_Vigencia` datetime NOT NULL,
  `Tasa_usd_a_bs` decimal(10,4) NOT NULL,
  PRIMARY KEY (`idTasa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-07 18:58:18
