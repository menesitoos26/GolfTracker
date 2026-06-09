import os
import bcrypt
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

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