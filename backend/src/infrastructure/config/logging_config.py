from pymongo import MongoClient, ASCENDING

def setup_logging_collection(client: MongoClient, db_name:str):
    db = client[db_name]
    collection = db["logs"]

    collection.create_index(
        [("timestamp", ASCENDING)],
        expireAfterSeconds = 2592000 # 30 Días
    )

    collection.create_index([("level", ASCENDING)])
    collection.create_index([("trace_id", ASCENDING)])

    return collection