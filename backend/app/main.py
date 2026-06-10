import os
import bcrypt
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional
from datetime import datetime


app = FastAPI(title="Golf Tracker API")

# Conexión automática con las credenciales de tu contenedor MySQL
DATABASE_URL = "mysql+pymysql://golf_user:golf_pass@db:3306/golf_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependencia para abrir y cerrar la conexión a la base de datos limpiamente
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modelos para validar los datos que llegan desde React
class RegistroUsuario(BaseModel):
    name: str
    email: str
    password: str

class LoginUsuario(BaseModel):
    email: str
    password: str

class HoyoData(BaseModel):
    numero: int
    par: int
    golpes: Optional[int] = None

class CursoData(BaseModel):
    club_name: str
    city: str = ""
    country: str = ""

class GuardarRondaPayload(BaseModel):
    user_id: int
    course: CursoData
    total_par: int
    total_strokes: int
    hoyos: List[HoyoData]


@app.get("/")
def root():
    return {"message": "Golf Tracker API funcionando"}

@app.get("/health")
def health():
    return {"status": "ok"}


# --- RUTAS DE LA API (Sin '/api' porque Nginx ya se encarga de quitarlo) ---

@app.post("/registro")
def ruta_registro(datos: RegistroUsuario, db: Session = Depends(get_db)):
    try:
        # Encriptamos la contraseña por seguridad antes de guardarla
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(datos.password.encode('utf-8'), salt).decode('utf-8')

        query = text("""
            INSERT INTO users (name, email, password_hash)
            VALUES (:name, :email, :password_hash)
        """)
        db.execute(query, {
            "name": datos.name,
            "email": datos.email,
            "password_hash": password_hash
        })
        db.commit() # Confirmamos el guardado en MySQL
        return {"mensaje": "Usuario registrado con éxito"}
    except Exception as e:
        db.rollback()
        print(f"Error en base de datos: {e}")
        raise HTTPException(status_code=400, detail="El correo ya está registrado o hubo un error.")


@app.post("/login")
def ruta_login(datos: LoginUsuario, db: Session = Depends(get_db)):
    try:
        # 1. Buscamos al usuario por su correo electrónico
        query = text("SELECT id, name, email, password_hash FROM users WHERE email = :email")
        result = db.execute(query, {"email": datos.email})
        usuario = result.fetchone()

        if not usuario:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

        # 2. SEGURO PARA SQLALCHEMY 2.0: Convertimos la fila en un diccionario limpio
        usuario_dict = usuario._mapping

        # 3. Convertimos los textos a formato binario (bytes) para que bcrypt trabaje bien
        password_bytes = datos.password.encode('utf-8')
        hash_en_base_datos = usuario_dict["password_hash"].encode('utf-8')

        # 4. Comprobamos si la contraseña coincide con su hash encriptado
        if bcrypt.checkpw(password_bytes, hash_en_base_datos):
            return {
                "mensaje": "Login exitoso",
                "usuario": {
                    "id": usuario_dict["id"],
                    "name": usuario_dict["name"],
                    "email": usuario_dict["email"]
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    except HTTPException as http_ex:
        # Errores de credenciales controlados (401), los dejamos pasar directos a React
        raise http_ex
    except Exception as e:
        # Si el código se rompe por otra causa, esto lo pintará en la consola de Docker para poder solucionarlo
        print(f"--- ERROR CRÍTICO DETECTADO EN EL LOGIN ---: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno en el servidor: {e}")
    

@app.get("/course/ultimo")
def obtener_ultimo_course(db: Session = Depends(get_db)):
    try:
        # 1. Buscamos el último campo registrado usando el ID auto-incremental más alto
        query_course = text("SELECT id, name, total_par FROM courses ORDER BY id DESC LIMIT 1")
        result_course = db.execute(query_course).fetchone()
        
        # SI LA BASE DE DATOS ESTÁ VACÍA (No hay ningún campo creado)
        if not result_course:
            # Generamos 18 hoyos virtuales configurados todos a par 0
            hoyos_ceros = [{"hole_number": i, "par": 0} for i in range(1, 19)]
            return {"name": "Sin campos registrados", "total_par": 0, "holes": hoyos_ceros}
        
        # Si sí encontramos un campo, extraemos sus datos limpios
        course_dict = result_course._mapping
        course_id = course_dict["id"]
        
        # 2. Traemos los hoyos pertenecientes a este campo específico ordenados del 1 al 18
        query_holes = text("SELECT hole_number, par FROM holes WHERE course_id = :course_id ORDER BY hole_number ASC")
        result_holes = db.execute(query_holes, {"course_id": course_id}).fetchall()
        
        hoyos = [dict(h._mapping) for h in result_holes]
        
        # Control de seguridad: Si el campo existe pero no tiene hoyos guardados
        if not hoyos:
            hoyos = [{"hole_number": i, "par": 0} for i in range(1, 19)]
            
        return {
            "name": course_dict["name"],
            "total_par": course_dict["total_par"],
            "holes": hoyos
        }
        
    except Exception as e:
        print(f"Error al obtener el último campo: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
    
from datetime import datetime

@app.get("/rondas/{user_id}")
def obtener_rondas_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        # Consulta SQL combinando las tablas rounds, courses y hole_scores
        query = text("""
            SELECT 
                r.id,
                c.name AS campo,
                r.date AS fecha,
                r.total_strokes AS golpes,
                (r.total_strokes - c.total_par) AS diferencia_par,
                COALESCE(SUM(hs.putts), 0) AS putts
            FROM rounds r
            JOIN courses c ON r.course_id = c.id
            LEFT JOIN hole_scores hs ON r.id = hs.round_id
            WHERE r.user_id = :user_id
            GROUP BY r.id, c.name, r.date, r.total_strokes, c.total_par
            ORDER BY r.date DESC
        """)
        
        resultados = db.execute(query, {"user_id": user_id}).fetchall()
        
        rondas_formateadas = []
        for row in resultados:
            row_dict = row._mapping
            
            # Formateamos el +/- Par
            diferencia = row_dict["diferencia_par"]
            if diferencia is None:
                plus_minus = "-"
            elif diferencia > 0:
                plus_minus = f"+{diferencia}"
            elif diferencia == 0:
                plus_minus = "E" # Even / Par
            else:
                plus_minus = str(diferencia)

            # Damos formato a la fecha (Ej: "15 may 2026")
            fecha_obj = row_dict["fecha"]
            fecha_str = fecha_obj.strftime("%d %b %Y") if isinstance(fecha_obj, datetime) else str(fecha_obj)

            rondas_formateadas.append({
                "id": row_dict["id"],
                "campo": row_dict["campo"],
                "fecha": fecha_str.lower(),
                "golpes": row_dict["golpes"] or "-",
                "plusMinus": plus_minus,
                "putts": int(row_dict["putts"])
            })
            
        return rondas_formateadas

    except Exception as e:
        print(f"Error al obtener las rondas: {e}")
        raise HTTPException(status_code=500, detail="Error interno al cargar las rondas")
import random
from datetime import datetime

@app.post("/crear-ronda-prueba/{user_id}")
def crear_ronda_prueba(user_id: int, db: Session = Depends(get_db)):

    try:
        # 1. Creamos un campo de prueba (INSERT IGNORE evita que se duplique si ya existe)
        db.execute(text("""
            INSERT IGNORE INTO courses (external_id, name, total_par) 
            VALUES ('TEST-001', 'Campo Aleatorio', 72)
        """))
        
        # Obtenemos el ID de ese campo
        course = db.execute(text("SELECT id FROM courses WHERE name = 'Campo Aleatorio' LIMIT 1")).fetchone()
        course_id = course._mapping["id"]

        # 2. Generamos unos golpes aleatorios para simular una partida
        golpes_aleatorios = random.randint(70, 105)
        
        # 3. Insertamos la ronda en la tabla rounds
        query = text("""
            INSERT INTO rounds (user_id, course_id, date, total_strokes, notes)
            VALUES (:user_id, :course_id, :date, :total_strokes, 'Generado automáticamente')
        """)
        
        db.execute(query, {
            "user_id": user_id,
            "course_id": course_id,
            "date": datetime.now().date(),
            "total_strokes": golpes_aleatorios
        })
        
        db.commit() # ¡Guardamos los cambios en MySQL!
        return {"mensaje": "¡Datos de prueba inyectados con éxito!"}
        
    except Exception as e:
        db.rollback() # Si algo falla, deshacemos para no corromper la BD
        print(f"Error inyectando datos: {e}")
        raise HTTPException(status_code=500, detail="Error al crear datos de prueba")
    
@app.post("/guardar-ronda")
def guardar_ronda(payload: GuardarRondaPayload, db: Session = Depends(get_db)):
    try:
        # 1. COMPROBAR SI EL CAMPO YA EXISTE
        query_course = text("SELECT id FROM courses WHERE name = :name LIMIT 1")
        course_record = db.execute(query_course, {"name": payload.course.club_name}).fetchone()

        if course_record:
            course_id = course_record._mapping["id"]
        else:
            # 1.1 Si no existe, lo creamos en la tabla courses
            insert_course = text("""
                INSERT INTO courses (name, city, country, total_par)
                VALUES (:name, :city, :country, :total_par)
            """)
            res_course = db.execute(insert_course, {
                "name": payload.course.club_name,
                "city": payload.course.city,
                "country": payload.course.country,
                "total_par": payload.total_par
            })
            # Obtenemos el ID del campo recién creado
            course_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

            # 1.2 Creamos la configuración de sus hoyos en la tabla holes
            insert_hole = text("""
                INSERT INTO holes (course_id, hole_number, par)
                VALUES (:course_id, :hole_number, :par)
            """)
            for h in payload.hoyos:
                db.execute(insert_hole, {
                    "course_id": course_id,
                    "hole_number": h.numero,
                    "par": h.par
                })

        # 2. CREAR LA RONDA (Tabla rounds)
        insert_round = text("""
            INSERT INTO rounds (user_id, course_id, date, total_strokes, notes)
            VALUES (:user_id, :course_id, :date, :total_strokes, 'Ronda guardada desde la app')
        """)
        db.execute(insert_round, {
            "user_id": payload.user_id,
            "course_id": course_id,
            "date": datetime.now().date(),
            "total_strokes": payload.total_strokes
        })
        round_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

        # 3. GUARDAR LOS GOLPES POR HOYO (Tabla hole_scores)
        insert_score = text("""
            INSERT INTO hole_scores (round_id, hole_id, strokes)
            VALUES (
                :round_id, 
                (SELECT id FROM holes WHERE course_id = :course_id AND hole_number = :hole_number),
                :strokes
            )
        """)
        for h in payload.hoyos:
            # Solo guardamos los hoyos que el usuario haya rellenado realmente
            if h.golpes is not None and h.golpes > 0:
                db.execute(insert_score, {
                    "round_id": round_id,
                    "course_id": course_id,
                    "hole_number": h.numero,
                    "strokes": h.golpes
                })

        db.commit() # Confirmar guardado masivo en MySQL
        return {"mensaje": "¡Tarjeta guardada con éxito!"}

    except Exception as e:
        db.rollback() # Si algo falla, cancelamos todo para no dejar datos a medias
        print(f"Error al guardar ronda: {e}")
        raise HTTPException(status_code=500, detail="Error interno al guardar la ronda")