-- Migración del esquema antiguo (v1) al nuevo (v2).
--
-- Sólo hace falta si ya tienes una base de datos con datos creada con el
-- init.sql anterior. Si arrancas de cero, docker/init.sql ya crea el esquema
-- correcto y este fichero no se usa.
--
-- Cambios:
--   * courses pierde total_par (el par ahora vive en la tarjeta de la ronda)
--   * holes + hole_scores se fusionan en round_holes
--   * rounds: date -> played_on, y gana holes_played, total_par, total_putts,
--     tournament_id, course_rating, slope_rating, weather
--   * nueva tabla tournaments
--
-- Uso:
--   docker exec -i golf_db mysql -ugolf_user -pgolf_pass golf_db < 001_esquema_v1_a_v2.sql
--
-- IMPORTANTE: haz una copia de seguridad antes de ejecutarlo:
--   docker exec golf_db mysqldump -ugolf_user -pgolf_pass golf_db > copia.sql

SET NAMES utf8mb4;
START TRANSACTION;

-- 1. Usuarios: nueva columna de auditoría
ALTER TABLE users
    ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Torneos (tabla nueva)
CREATE TABLE IF NOT EXISTS tournaments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    name            VARCHAR(150) NOT NULL,
    location        VARCHAR(150) DEFAULT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE DEFAULT NULL,
    final_position  INT DEFAULT NULL,
    notes           TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY ix_tournaments_user_id (user_id),
    CONSTRAINT fk_tournaments_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Rondas: columnas nuevas
ALTER TABLE rounds
    ADD COLUMN tournament_id INT DEFAULT NULL,
    ADD COLUMN played_on     DATE NULL,
    ADD COLUMN holes_played  INT NULL,
    ADD COLUMN total_par     INT NULL,
    ADD COLUMN total_putts   INT DEFAULT NULL,
    ADD COLUMN course_rating DECIMAL(4,1) DEFAULT NULL,
    ADD COLUMN slope_rating  INT DEFAULT NULL,
    ADD COLUMN weather       VARCHAR(50) DEFAULT NULL,
    ADD COLUMN updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

UPDATE rounds SET played_on = `date` WHERE played_on IS NULL;

-- 4. Tarjeta unificada
CREATE TABLE IF NOT EXISTS round_holes (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    round_id            INT NOT NULL,
    hole_number         INT NOT NULL,
    par                 INT NOT NULL,
    strokes             INT NOT NULL,
    putts               INT DEFAULT NULL,
    fairway_hit         BOOLEAN DEFAULT NULL,
    green_in_regulation BOOLEAN DEFAULT NULL,
    penalties           INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_round_hole (round_id, hole_number),
    KEY ix_round_holes_round_id (round_id),
    CONSTRAINT fk_round_holes_round FOREIGN KEY (round_id)
        REFERENCES rounds(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO round_holes (round_id, hole_number, par, strokes, putts, fairway_hit)
SELECT hs.round_id, h.hole_number, h.par, hs.strokes, hs.putts, hs.fairway_hit
FROM hole_scores hs
JOIN holes h ON h.id = hs.hole_id;

-- 5. Recalcular los totales de cada ronda a partir de la tarjeta ya migrada
UPDATE rounds r
JOIN (
    SELECT round_id,
           COUNT(*)      AS hoyos,
           SUM(par)      AS par_total,
           SUM(strokes)  AS golpes_total
    FROM round_holes
    GROUP BY round_id
) t ON t.round_id = r.id
SET r.holes_played  = t.hoyos,
    r.total_par     = t.par_total,
    r.total_strokes = COALESCE(r.total_strokes, t.golpes_total);

-- Rondas antiguas sin tarjeta: usamos el par del campo como aproximación.
UPDATE rounds r
JOIN courses c ON c.id = r.course_id
SET r.holes_played = 18,
    r.total_par    = c.total_par
WHERE r.holes_played IS NULL;

DELETE FROM rounds WHERE total_par IS NULL OR total_strokes IS NULL;

ALTER TABLE rounds
    MODIFY played_on    DATE NOT NULL,
    MODIFY holes_played INT NOT NULL,
    MODIFY total_par    INT NOT NULL,
    MODIFY total_strokes INT NOT NULL,
    DROP COLUMN `date`,
    ADD CONSTRAINT fk_rounds_tournament FOREIGN KEY (tournament_id)
        REFERENCES tournaments(id) ON DELETE SET NULL,
    ADD KEY ix_rounds_user_played_on (user_id, played_on);

-- 6. Fuera las tablas antiguas
DROP TABLE IF EXISTS hole_scores;
DROP TABLE IF EXISTS holes;

-- 7. Deduplicar campos.
-- El código antiguo creaba un campo nuevo por cada combinación de nombre y par
-- total, así que el mismo club podía estar repetido varias veces. Reapuntamos
-- las rondas al registro más antiguo y borramos los duplicados, porque si no
-- la clave única de (name, city) no se podría crear.
CREATE TEMPORARY TABLE campos_canonicos AS
SELECT MIN(id) AS id_bueno, name, city
FROM courses
GROUP BY name, city;

UPDATE rounds r
JOIN courses c        ON c.id = r.course_id
JOIN campos_canonicos cc
     ON cc.name = c.name AND (cc.city <=> c.city)
SET r.course_id = cc.id_bueno
WHERE r.course_id <> cc.id_bueno;

DELETE FROM courses
WHERE id NOT IN (SELECT id_bueno FROM campos_canonicos);

DROP TEMPORARY TABLE campos_canonicos;

ALTER TABLE courses
    DROP COLUMN total_par,
    ADD UNIQUE KEY uq_course_name_city (name, city);

COMMIT;
