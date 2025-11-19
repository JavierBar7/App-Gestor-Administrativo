DROP SCHEMA IF EXISTS DataBaseGestorDeCobro ;
CREATE SCHEMA IF NOT EXISTS DataBaseGestorDeCobro DEFAULT CHARACTER SET utf8 ;
USE DataBaseGestorDeCobro ;
  
  
  CREATE TABLE Representantes (
  idRepresentante INT NOT NULL AUTO_INCREMENT,
  Nombres varchar(50) NOT NULL,
  Apellidos varchar(50) NOT NULL,
  Cedula varchar(15) NOT NULL UNIQUE,
  Parentesco varchar(50) NOT NULL,
  Correo varchar(50) DEFAULT NULL UNIQUE,
  Direccion varchar(100) NULL,
  PRIMARY KEY (idRepresentante)
);

  CREATE TABLE Telefonos_Representante (
  idTelefonos_Representante INT NOT NULL AUTO_INCREMENT,
  idRepresentante INT NOT NULL,
  Numero varchar(20) NOT NULL,
  Tipo varchar(10) NOT NULL,
  primary key (idTelefonos_Representante),
  
	foreign key(idRepresentante) 
	references Representantes (idRepresentante)
    on delete cascade
  );
  
  CREATE TABLE Estudiantes(
	idEstudiante INT NOT NULL AUTO_INCREMENT,
    Nombres varchar(45) NOT NULL,
    Apellidos varchar(45) NOT NULL,
    Cedula varchar (15) NOT NULL UNIQUE,
    Fecha_Nacimiento date NOT NULL,
    Telefono varchar(20) NOT NULL,
    Correo varchar(50) NOT NULL UNIQUE, 
    Direccion varchar(100) NOT NULL, 
    primary key (idEstudiante)
);

CREATE TABLE historial_estado_estudiante (
  idHistorial int NOT NULL AUTO_INCREMENT,
  idEstudiante int NOT NULL,
  Fecha_Cambio DATE NOT NULL,
  Estado enum('Activo','Inactivo') NOT NULL,
  Motivo varchar(50) DEFAULT NULL,
  PRIMARY KEY (idHistorial),
  KEY idEstudiante (idEstudiante),
  FOREIGN KEY (idEstudiante) 
  REFERENCES estudiantes (idEstudiante)
);

CREATE TABLE Representante_Estudiante (
  idRepresentante INT NOT NULL,
  idEstudiante INT NOT NULL,
  primary key (idRepresentante, idEstudiante),
  
	foreign key(idRepresentante) 
	references Representantes (idRepresentante)
    on delete cascade,
    
	foreign key(idEstudiante) 
	references Estudiantes (idEstudiante)
	on delete cascade
  );
  
    CREATE TABLE Cursos (
  idCurso int NOT NULL AUTO_INCREMENT,
  Nombre_Curso varchar(50) NOT NULL,
  Descripcion_Curso varchar(50) NOT NULL,
  PRIMARY KEY (idCurso)
);

  CREATE TABLE Inscripciones (
  idEstudiante int NOT NULL,
  idCurso int NOT NULL,
  Fecha_inscripcion date NOT NULL,

  primary key (idEstudiante, idCurso),
  
	foreign key(idEstudiante) 
	references Estudiantes (idEstudiante)
	on delete cascade,
	foreign key(idCurso) 
	references Cursos (idCurso)
    on delete restrict
);

CREATE TABLE Grupos (
  idGrupo int NOT NULL AUTO_INCREMENT,
  idCurso int NOT NULL,
  Nombre_Grupo varchar(50) NOT NULL,
  Fecha_inicio date NOT NULL,
  Estado varchar(50) NOT NULL,
  
  primary key (idGrupo),
  
	foreign key(idCurso) 
	references Cursos (idCurso)

);

-- pagos

CREATE TABLE Deudas (
  idDeuda int NOT NULL AUTO_INCREMENT,
  idEstudiante int NOT NULL,
  Monto_usd decimal(10,4) NOT NULL,
  Tasa_Emision DECIMAL(10,4) NOT NULL,
  Monto_bs_emision decimal(10,4) NOT NULL,
  Fecha_emision date NOT NULL,
  Fecha_vencimiento date NOT NULL,
  Concepto varchar(45) NOT NULL,
  Estado varchar(45) NOT NULL,
   primary key (idDeuda),
  
	foreign key(idEstudiante) 
	references Estudiantes (idEstudiante)
	on delete cascade
);

CREATE TABLE Cuenta_destino (
  idCuenta_Destino int NOT NULL AUTO_INCREMENT,
  Nombre varchar(45) NOT NULL,
  Tipo varchar(45) NOT NULL,
  Moneda varchar(45) NOT NULL,
  PRIMARY KEY (idCuenta_Destino)
);

CREATE TABLE Metodos_pagos (
  idMetodos_pago int NOT NULL AUTO_INCREMENT,
  Nombre varchar(45) NOT NULL,
  Tipo_Validacion varchar(45) NOT NULL,
  Moneda_asociada varchar(45) NOT NULL,
  PRIMARY KEY (idMetodos_pago)
);

CREATE TABLE Pagos (
  idPago INT NOT NULL AUTO_INCREMENT,
  idDeuda INT NOT NULL,
  idMetodos_pago INT NOT NULL,
  idCuenta_Destino INT NOT NULL,
  idEstudiante INT NOT NULL,
  Referencia VARCHAR(20) NOT NULL,
  Monto_bs DECIMAL(10,4) NOT NULL, -- El monto real pagado en Bs
  Tasa_Pago DECIMAL(10,4) NOT NULL, -- La tasa vigente usada para este pago
  Monto_usd DECIMAL(10,4) NOT NULL, -- Conversión: Monto_bs / Tasa_Pago
  Fecha_pago DATE NOT NULL,
  PRIMARY KEY (idPago),
  
	foreign key(idDeuda) 
	references Deudas (idDeuda)
	on delete cascade,
    foreign key(idMetodos_pago) 
	references Metodos_pagos (idMetodos_pago)
	on delete cascade,
	foreign key(idCuenta_Destino) 
	references Cuenta_destino (idCuenta_Destino)
    on delete restrict,
    foreign key(idEstudiante) 
	references Estudiantes (idEstudiante)
	on delete cascade

);

CREATE TABLE Ajustes_deuda (
  idAjuste int NOT NULL AUTO_INCREMENT,
  idDeuda int NOT NULL,
  Tasa_Ajuste DECIMAL(10,4) NOT NULL,
  Tipo_ajuste varchar(45) NOT NULL,
  Monto_usd decimal(10,4) NOT NULL,
  Fecha_ajuste DATE NOT NULL,
  Descripcion varchar(50) NOT NULL,
  primary key (idAjuste),
  
  foreign key(idDeuda) 
	references Deudas (idDeuda)
	on delete cascade
);


CREATE TABLE Pagos_parciales (
  idPagos_Parciales int NOT NULL AUTO_INCREMENT,
  idPago int NOT NULL,
  idDeuda int NOT NULL,
  Monto_parcial decimal(10,4) NOT NULL,
    PRIMARY KEY (idPagos_Parciales),

 foreign key(idPago) 
	references Pagos (idPago)
	on delete cascade,
 foreign key(idDeuda) 
	references Deudas (idDeuda)
	on delete cascade
);

CREATE TABLE historial_tasa (
  idHistorial_Tasa INT NOT NULL AUTO_INCREMENT,
  Tasa_Registrada DECIMAL(10,4) NOT NULL,
  Fecha_Registro DATE NOT NULL,
  PRIMARY KEY (idHistorial_Tasa)
);

CREATE TABLE Tasa_cambio (
  idTasa INT NOT NULL AUTO_INCREMENT,
  Fecha_Vigencia DATE NOT NULL,
  Tasa_usd_a_bs DECIMAL(10,4) NOT NULL,
  PRIMARY KEY (idTasa)
);

CREATE TABLE Billetes_cash (
  idBillete INT NOT NULL AUTO_INCREMENT, -- Cambio realizado aquí
  idPago INT NOT NULL,
  Codigo_Billete VARCHAR(25) NOT NULL,
  Denominacion DECIMAL(10,2),
  PRIMARY KEY (idBillete),
  FOREIGN KEY (idPago) REFERENCES Pagos (idPago) ON DELETE CASCADE
);

CREATE TABLE Control_mensualidades (
  idControl INT NOT NULL AUTO_INCREMENT,
  idEstudiante INT NOT NULL,
  idPago INT NOT NULL,
  Mes INT NOT NULL, -- 1 para Enero, 10 para Octubre, etc.
  Observacion VARCHAR(50) NULL,
  PRIMARY KEY (idControl),
  UNIQUE KEY unique_pago_mes (idEstudiante, Mes), -- Evita duplicar pago del mismo mes
    FOREIGN KEY (idEstudiante)
    REFERENCES estudiantes (idEstudiante)
    ON DELETE CASCADE,
    FOREIGN KEY (idPago)
    REFERENCES pagos (idPago)
    ON DELETE CASCADE
);
-- Usuarios
CREATE TABLE Roles (
  idRol INT NOT NULL AUTO_INCREMENT,
  Nombre_Rol VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Administrador', 'Gestor de Usuarios'
  PRIMARY KEY (idRol)
);
CREATE TABLE Usuarios (
  idUsuario INT NOT NULL AUTO_INCREMENT,
  idRol INT NOT NULL,
  Nombre_Usuario VARCHAR(50) NOT NULL UNIQUE,
  Clave VARCHAR(255) NOT NULL, -- Siempre usa un hash (ej: SHA-256) y nunca la clave en texto plano.
  PRIMARY KEY (idUsuario),
  FOREIGN KEY (idRol)
    REFERENCES Roles (idRol)
    ON DELETE RESTRICT 
);