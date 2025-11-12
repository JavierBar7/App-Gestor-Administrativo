SELECT * FROM usuarios;

INSERT INTO roles (idRol, Nombre_Rol) 
VALUES (1, 'Administrador');

INSERT INTO usuarios (idRol, Nombre_Usuario, Clave) 
VALUES (1, 'admin', 'admin123');