#!/usr/bin/env python3
"""
Script para ver logs almacenados en MongoDB desde tu logger SIPAD
"""

from pymongo import MongoClient
from datetime import datetime, timedelta
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import os
import urllib.parse

# Cargar variables de entorno
env_path = Path(".environment")
if env_path.exists():
    load_dotenv(env_path)

# Configuración de conexión
MONGO_ROUTE = os.getenv("MONGO_ROUTE", "localhost")
MONGO_USER = os.getenv("MONGO_USER", "admin")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "admin")
MONGO_PORT = os.getenv("MONGO_PORT", "27017")
DB_NAME = os.getenv("MONGO_DB", "carga_academica")
SERVICE_NAME = os.getenv("SERVICE_NAME", "sipad-api")
COLLECTION_NAME = "logs"

def conectar():
    """Conecta a MongoDB"""
    try:
        username = urllib.parse.quote_plus(MONGO_USER)
        password = urllib.parse.quote_plus(MONGO_PASSWORD)
        route    = urllib.parse.quote_plus(MONGO_ROUTE)
        port     = urllib.parse.quote_plus(MONGO_PORT)
        client = MongoClient('mongodb://%s:%s@%s:%s' % (username,password,route,port), serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        return client[DB_NAME][COLLECTION_NAME]
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        sys.exit(1)

def ultimos_logs(cantidad=20, servicio=None):
    """Muestra los últimos N logs"""
    logs = conectar()
    filtro = {}
    if servicio:
        filtro["service"] = servicio
    
    docs = list(logs.find(filtro).sort("_id", -1).limit(cantidad))
    
    if len(docs) == 0:
        print("No hay logs")
        return
    
    for log in docs:
        timestamp = log.get("timestamp", "N/A")
        level = log.get("level", "N/A")
        mensaje = log.get("message", "N/A")
        service = log.get("service", "N/A")
        trace_id = log.get("trace_id", "")
        
        # Colores según nivel
        color = {
            "ERROR": "\033[91m",      # Rojo
            "WARNING": "\033[93m",    # Amarillo
            "INFO": "\033[92m",       # Verde
            "DEBUG": "\033[94m"       # Azul
        }
        reset = "\033[0m"
        
        c = color.get(level, "")
        trace_str = f" (trace: {trace_id})" if trace_id else ""
        print(f"{c}[{timestamp}] {level} [{service}]: {mensaje}{trace_str}{reset}")

def logs_por_nivel(nivel, servicio=None):
    """Filtra logs por nivel (ERROR, WARNING, INFO, DEBUG)"""
    logs = conectar()
    filtro = {"level": nivel}
    if servicio:
        filtro["service"] = servicio
    
    docs = list(logs.find(filtro).sort("_id", -1).limit(50))
    
    if len(docs) == 0:
        print(f"No hay logs con nivel {nivel}")
        return
    
    print(f"\n📋 {len(docs)} logs con nivel {nivel}:\n")
    for log in docs:
        timestamp = log.get("timestamp", "N/A")
        mensaje = log.get("message", "N/A")
        service = log.get("service", "N/A")
        trace_id = log.get("trace_id", "")
        
        trace_str = f" (trace: {trace_id})" if trace_id else ""
        print(f"[{timestamp}] [{service}] {mensaje}{trace_str}")

def logs_recientes(horas=1, servicio=None):
    """Logs de las últimas N horas"""
    logs = conectar()
    fecha_limite = datetime.utcnow() - timedelta(hours=horas)
    
    filtro = {"timestamp": {"$gte": fecha_limite}}
    if servicio:
        filtro["service"] = servicio
    
    docs = list(logs.find(filtro).sort("_id", -1))
    
    if len(docs) == 0:
        print(f"No hay logs en las últimas {horas} horas")
        return
    
    print(f"\n⏰ {len(docs)} logs en las últimas {horas} horas:\n")
    for log in docs:
        timestamp = log.get("timestamp", "N/A")
        level = log.get("level", "N/A")
        mensaje = log.get("message", "N/A")
        service = log.get("service", "N/A")
        trace_id = log.get("trace_id", "")
        
        color = {
            "ERROR": "\033[91m",
            "WARNING": "\033[93m",
            "INFO": "\033[92m",
            "DEBUG": "\033[94m"
        }
        reset = "\033[0m"
        c = color.get(level, "")
        
        trace_str = f" (trace: {trace_id})" if trace_id else ""
        print(f"{c}[{timestamp}] {level} [{service}]: {mensaje}{trace_str}{reset}")

def buscar_en_logs(texto, servicio=None):
    """Busca logs que contengan cierto texto"""
    logs = conectar()
    filtro = {"message": {"$regex": texto, "$options": "i"}}
    if servicio:
        filtro["service"] = servicio
    
    docs = list(logs.find(filtro).sort("_id", -1).limit(30))
    
    if len(docs) == 0:
        print(f"No hay logs con '{texto}'")
        return
    
    print(f"\n🔍 {len(docs)} logs encontrados con '{texto}':\n")
    for log in docs:
        timestamp = log.get("timestamp", "N/A")
        nivel = log.get("level", "N/A")
        mensaje = log.get("message", "N/A")
        service = log.get("service", "N/A")
        trace_id = log.get("trace_id", "")
        context = log.get("context", {})
        
        trace_str = f" (trace: {trace_id})" if trace_id else ""
        print(f"[{timestamp}] {nivel} [{service}]: {mensaje}{trace_str}")
        
        if context:
            print(f"  Context: {json.dumps(context, indent=2, ensure_ascii=False)}")

def logs_por_trace(trace_id):
    """Busca todos los logs con un trace_id específico"""
    logs = conectar()
    docs = list(logs.find({"trace_id": trace_id}).sort("timestamp", 1))
    
    if len(docs) == 0:
        print(f"No hay logs con trace_id '{trace_id}'")
        return
    
    print(f"\n🔗 {len(docs)} logs con trace_id '{trace_id}':\n")
    for log in docs:
        timestamp = log.get("timestamp", "N/A")
        level = log.get("level", "N/A")
        mensaje = log.get("message", "N/A")
        service = log.get("service", "N/A")
        
        color = {
            "ERROR": "\033[91m",
            "WARNING": "\033[93m",
            "INFO": "\033[92m",
            "DEBUG": "\033[94m"
        }
        reset = "\033[0m"
        c = color.get(level, "")
        
        print(f"{c}[{timestamp}] {level} [{service}]: {mensaje}{reset}")

def estadisticas():
    """Muestra estadísticas de logs"""
    logs = conectar()
    total = logs.count_documents({})
    
    if total == 0:
        print("No hay logs en la base de datos")
        return
    
    # Por nivel
    por_nivel = list(logs.aggregate([
        {"$group": {"_id": "$level", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    
    # Por servicio
    por_servicio = list(logs.aggregate([
        {"$group": {"_id": "$service", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))
    
    print(f"\n📊 Estadísticas:\n")
    print(f"Total de logs: {total}\n")
    
    print("Por nivel:")
    for item in por_nivel:
        nivel = item["_id"]
        cantidad = item["count"]
        porcentaje = (cantidad / total * 100) if total > 0 else 0
        print(f"  {nivel}: {cantidad} ({porcentaje:.1f}%)")
    
    print("\nPor servicio:")
    for item in por_servicio:
        servicio = item["_id"]
        cantidad = item["count"]
        porcentaje = (cantidad / total * 100) if total > 0 else 0
        print(f"  {servicio}: {cantidad} ({porcentaje:.1f}%)")

def ver_log_detalle(log_id):
    """Muestra los detalles completos de un log"""
    logs = conectar()
    from bson.objectid import ObjectId
    
    try:
        doc = logs.find_one({"_id": ObjectId(log_id)})
        if not doc:
            print(f"Log no encontrado: {log_id}")
            return
        
        print("\n📄 Detalles del log:\n")
        print(f"ID: {doc['_id']}")
        print(f"Timestamp: {doc.get('timestamp', 'N/A')}")
        print(f"Level: {doc.get('level', 'N/A')}")
        print(f"Service: {doc.get('service', 'N/A')}")
        print(f"Trace ID: {doc.get('trace_id', 'N/A')}")
        print(f"Message: {doc.get('message', 'N/A')}")
        
        context = doc.get("context", {})
        if context:
            print(f"\nContext:")
            print(json.dumps(context, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")

def menu():
    """Menú interactivo"""
    while True:
        print("\n" + "="*60)
        print("📊 VISOR DE LOGS MONGODB - SIPAD")
        print("="*60)
        print("1. Ver últimos logs")
        print("2. Ver logs ERROR")
        print("3. Ver logs WARNING")
        print("4. Ver logs INFO")
        print("5. Ver logs de la última hora")
        print("6. Buscar en logs")
        print("7. Buscar por trace_id")
        print("8. Estadísticas")
        print("9. Salir")
        print("="*60)
        
        opcion = input("Elige una opción (1-9): ").strip()
        
        if opcion == "1":
            cant = input("¿Cuántos logs? (default 20): ").strip()
            ultimos_logs(int(cant) if cant.isdigit() else 20)
        elif opcion == "2":
            logs_por_nivel("ERROR")
        elif opcion == "3":
            logs_por_nivel("WARNING")
        elif opcion == "4":
            logs_por_nivel("INFO")
        elif opcion == "5":
            horas = input("¿Cuántas horas? (default 1): ").strip()
            logs_recientes(int(horas) if horas.isdigit() else 1)
        elif opcion == "6":
            texto = input("Buscar: ").strip()
            if texto:
                buscar_en_logs(texto)
        elif opcion == "7":
            trace = input("Trace ID: ").strip()
            if trace:
                logs_por_trace(trace)
        elif opcion == "8":
            estadisticas()
        elif opcion == "9":
            print("👋 Hasta luego")
            break
        else:
            print("Opción no válida")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Modo línea de comandos
        comando = sys.argv[1]
        
        if comando == "ultimos":
            cant = int(sys.argv[2]) if len(sys.argv) > 2 else 20
            ultimos_logs(cant)
        elif comando == "error":
            ultimos_logs(50)
            logs_por_nivel("ERROR")
        elif comando == "warning":
            logs_por_nivel("WARNING")
        elif comando == "info":
            logs_por_nivel("INFO")
        elif comando == "recientes":
            horas = int(sys.argv[2]) if len(sys.argv) > 2 else 1
            logs_recientes(horas)
        elif comando == "buscar":
            if len(sys.argv) > 2:
                buscar_en_logs(sys.argv[2])
            else:
                print("Uso: python mongo_logger_viewer.py buscar <texto>")
        elif comando == "trace":
            if len(sys.argv) > 2:
                logs_por_trace(sys.argv[2])
            else:
                print("Uso: python mongo_logger_viewer.py trace <trace_id>")
        elif comando == "stats":
            estadisticas()
        else:
            print("Comando no reconocido")
    else:
        # Modo menú interactivo
        menu()