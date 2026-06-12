import os
import random
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
        # 1. MODIFICADO: Ahora también seleccionamos la columna 'handicap' de la tabla users
        query = text("SELECT id, name, email, password_hash, handicap FROM users WHERE email = :email")
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
                    "email": usuario_dict["email"],
                    # MODIFICADO: Enviamos el hándicap a React (si es None en MySQL, mandamos null)
                    "handicap": float(usuario_dict["handicap"]) if usuario_dict["handicap"] is not None else None
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(f"--- ERROR CRÍTICO DETECTADO EN EL LOGIN ---: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno en el servidor: {e}")
    

@app.get("/course/ultimo")
def obtener_ultimo_course(db: Session = Depends(get_db)):
    try:
        query_course = text("""
            SELECT c.id, c.name, c.total_par 
            FROM courses c
            JOIN rounds r ON c.id = r.course_id
            ORDER BY r.id DESC LIMIT 1
        """)
        result_course = db.execute(query_course).fetchone()
        
        if not result_course: 
            result_course = db.execute(text("SELECT id, name, total_par FROM courses ORDER BY id DESC LIMIT 1")).fetchone()
            
        if not result_course:
            hoyos_ceros = [{"hole_number": i, "par": 0} for i in range(1, 19)]
            return {"name": "Sin campos registrados", "total_par": 0, "holes": hoyos_ceros}
            
        course_dict = result_course._mapping
        course_id = course_dict["id"]
        
        query_holes = text("SELECT hole_number, par FROM holes WHERE course_id = :course_id ORDER BY hole_number ASC")
        result_holes = db.execute(query_holes, {"course_id": course_id}).fetchall()
        
        hoyos = [dict(h._mapping) for h in result_holes]
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
    
@app.get("/rondas/{user_id}")
def obtener_rondas_usuario(user_id: int, db: Session = Depends(get_db)):
    try:
        # Buscamos las rondas guardadas del usuario en la base de datos
        query = text("""
            SELECT r.id, r.date, r.total_strokes, c.name AS club_name, c.total_par
            FROM rounds r
            JOIN courses c ON r.course_id = c.id
            WHERE r.user_id = :user_id
            ORDER BY r.date DESC, r.id DESC
        """)
        result = db.execute(query, {"user_id": user_id}).fetchall()
        
        rondas = []
        for fila in result:
            r_dict = fila._mapping
            rondas.append({
                "id": r_dict["id"],
                "date": str(r_dict["date"]),
                "total_strokes": r_dict["total_strokes"],
                "course": {
                    "club_name": r_dict["club_name"],
                    "total_par": r_dict["total_par"]
                }
            })
        return rondas
    except Exception as e:
        print(f"Error al obtener rondas del usuario {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al cargar el historial de rondas.")
    
@app.post("/guardar-ronda")
def guardar_ronda(payload: GuardarRondaPayload, db: Session = Depends(get_db)):
    try:
        # 1. COMPROBAR SI EL CAMPO YA EXISTE
        query_course = text("SELECT id FROM courses WHERE name = :name LIMIT 1")
        course_record = db.execute(query_course, {"name": payload.course.club_name}).fetchone()

        if course_record:
            course_id = course_record._mapping["id"]
            db.execute(text("UPDATE courses SET total_par = :t_par WHERE id = :cid"), {"t_par": payload.total_par, "cid": course_id})
            
            for h in payload.hoyos:
                hoyo_existe = db.execute(text("SELECT id FROM holes WHERE course_id = :cid AND hole_number = :hnum"), {"cid": course_id, "hnum": h.numero}).fetchone()
                if hoyo_existe:
                    db.execute(text("UPDATE holes SET par = :par WHERE id = :hid"), {"par": h.par, "hid": hoyo_existe._mapping["id"]})
                else:
                    db.execute(text("INSERT INTO holes (course_id, hole_number, par) VALUES (:cid, :hnum, :par)"), {"cid": course_id, "hnum": h.numero, "par": h.par})
        else:
            insert_course = text("""
                INSERT INTO courses (name, city, country, total_par)
                VALUES (:name, :city, :country, :total_par)
            """)
            db.execute(insert_course, {
                "name": payload.course.club_name,
                "city": payload.course.city,
                "country": payload.course.country,
                "total_par": payload.total_par
            })
            course_id = db.execute(text("SELECT LAST_INSERT_ID()")).scalar()

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

        # 2. CREAR LA RONDA
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

        # 3. GUARDAR LOS GOLPES
        insert_score = text("""
            INSERT INTO hole_scores (round_id, hole_id, strokes)
            VALUES (
                :round_id, 
                (SELECT id FROM holes WHERE course_id = :course_id AND hole_number = :hole_number),
                :strokes
            )
        """)
        for h in payload.hoyos:
            if h.golpes is not None and h.golpes > 0:
                db.execute(insert_score, {
                    "round_id": round_id,
                    "course_id": course_id,
                    "hole_number": h.numero,
                    "strokes": h.golpes
                })

        # 4. RECALCULAR HÁNDICAP
        query_recalculo = text("""
            SELECT AVG(r.total_strokes - c.total_par) as nuevo_handicap
            FROM rounds r
            JOIN courses c ON r.course_id = c.id
            WHERE r.user_id = :user_id
        """)
        resultado = db.execute(query_recalculo, {"user_id": payload.user_id}).fetchone()
        
        valor_handicap = resultado.nuevo_handicap if resultado and resultado.nuevo_handicap is not None else 0.0
        handicap_redondeado = round(float(valor_handicap), 1)

        db.execute(text("UPDATE users SET handicap = :handicap WHERE id = :user_id"), {"handicap": handicap_redondeado, "user_id": payload.user_id})

        db.commit()
        
        return {
            "mensaje": "¡Tarjeta guardada con éxito!",
            "nuevo_handicap": handicap_redondeado
        }

    except Exception as e:
        db.rollback()
        print(f"Error al guardar ronda: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno al guardar la ronda: {str(e)}")
    
@app.get("/rondas/ultima/detalle/{user_id}") 
def obtener_detalle_ultima_ronda(user_id: int, db: Session = Depends(get_db)):
    try:
        # 1. Buscamos el ID de la última ronda real que registró este usuario
        query_ronda = text("""
            SELECT id FROM rounds 
            WHERE user_id = :user_id 
            ORDER BY date DESC, r.id DESC LIMIT 1
        """)
        # Nota: Si da error por la 'r.id' de tu estructura anterior, déjalo como 'id DESC'
        query_ronda = text("""
            SELECT id FROM rounds 
            WHERE user_id = :user_id 
            ORDER BY date DESC, id DESC LIMIT 1
        """)
        ronda = db.execute(query_ronda, {"user_id": user_id}).fetchone()
        
        if not ronda:
            return [] # Si no hay rondas, devolvemos lista vacía
            
        round_id = ronda._mapping["id"]
        
        # 2. Traemos SOLO los hoyos jugados en ESA ronda específica cruzados con sus golpes reales
        query_detalles = text("""
            SELECT h.hole_number, h.par, hs.strokes AS golpes
            FROM hole_scores hs
            JOIN holes h ON hs.hole_id = h.id
            WHERE hs.round_id = :round_id
            ORDER BY h.hole_number ASC
        """)
        resultados = db.execute(query_detalles, {"round_id": round_id}).fetchall()
        
        datos_hoyos = []
        for fila in resultados:
            f_dict = fila._mapping
            datos_hoyos.append({
                "hole_number": f_dict["hole_number"],
                "par": f_dict["par"],
                "golpes": f_dict["golpes"]
            })
            
        return datos_hoyos
        
    except Exception as e:
        print(f"Error al obtener detalle de la última ronda: {e}")
        raise HTTPException(status_code=500, detail="Error al cargar la gráfica.")