CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    handicap        DECIMAL(4,1) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    external_id     VARCHAR(50) UNIQUE,
    name            VARCHAR(255) NOT NULL,
    city            VARCHAR(100),
    country         VARCHAR(100),
    total_par       INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE holes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    course_id       INT NOT NULL,
    hole_number     INT NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    par             INT NOT NULL CHECK (par BETWEEN 3 AND 6),
    distance_m      INT,
    UNIQUE(course_id, hole_number),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE rounds (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    course_id       INT NOT NULL,
    date            DATE NOT NULL,
    total_strokes   INT,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

CREATE TABLE hole_scores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    round_id        INT NOT NULL,
    hole_id         INT NOT NULL,
    strokes         INT NOT NULL CHECK (strokes > 0),
    putts           INT CHECK (putts >= 0),
    fairway_hit     BOOLEAN DEFAULT NULL,
    UNIQUE(round_id, hole_id),
    FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (hole_id) REFERENCES holes(id)
);

CREATE INDEX idx_rounds_user_id ON rounds(user_id);
CREATE INDEX idx_rounds_date ON rounds(date);
CREATE INDEX idx_hole_scores_round_id ON hole_scores(round_id);
CREATE INDEX idx_holes_course_id ON holes(course_id);