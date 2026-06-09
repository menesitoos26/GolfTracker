import bcrypt
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException

# ---------------------------------------------------------
# 1. Registrar Usuario
# ---------------------------------------------------------
def crear_usuario(db: Session, email: str, password_plana: str, name: str, handicap: float = None):
    # Generar el hash seguro de la contraseña
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password_plana.encode('utf-8'), salt).decode('utf-8')

    query = text("""
        INSERT INTO users (email, password_hash, name, handicap)
        VALUES (:email, :password_hash, :name, :handicap)
    """)
    
    db.execute(query, {
        "email": email,
        "password_hash": password_hash,
        "name": name,
        "handicap": handicap
    })
    db.commit() # Guardamos los cambios
    return True


# ---------------------------------------------------------
# 2. Login
# ---------------------------------------------------------
def verificar_usuario(db: Session, email: str, password_plana: str):
    # Buscamos al usuario por su email
    query = text("SELECT id, email, password_hash, name, handicap FROM users WHERE email = :email")
    usuario = db.execute(query, {"email": email}).fetchone()

    # Si el email no existe, devolvemos None
    if not usuario:
        return None 

    # Comprobamos si la contraseña que escribió coincide con el hash guardado
    if bcrypt.checkpw(password_plana.encode('utf-8'), usuario.password_hash.encode('utf-8')):
        return usuario # Todo correcto, devolvemos los datos del usuario
    else:
        return None # Contraseña incorrecta


# ---------------------------------------------------------
# 3. VER TODOS LOS DATOS (Para pruebas / Panel de Admin)
# ---------------------------------------------------------
def obtener_todos_los_usuarios(db: Session):
    query = text("SELECT id, name, email, handicap, created_at FROM users")
    usuarios = db.execute(query).fetchall()
    
    # Transformamos el resultado de SQL en una lista de diccionarios 
    # para que FastAPI lo pueda enviar como JSON a tu React
    lista_usuarios = []
    for u in usuarios:
        lista_usuarios.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "handicap": float(u.handicap) if u.handicap else None,
            "created_at": str(u.created_at)
        })
    
    return lista_usuarios



