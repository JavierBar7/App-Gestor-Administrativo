-- Migration: add idGrupo to inscripciones to associate students to groups
-- Run this on your MySQL server (make a backup first)

ALTER TABLE inscripciones
ADD COLUMN idGrupo INT(11) NULL,
ADD KEY (idGrupo);

-- If you want a foreign key constraint (ensure grupos exists):
-- ALTER TABLE inscripciones
-- ADD CONSTRAINT inscripciones_ibfk_3 FOREIGN KEY (idGrupo) REFERENCES grupos (idGrupo);

-- Note: don't run the FK line if your environment prevents adding constraints (or run it after ensuring grupos table is created).
