"""
Endpoint de diagnóstico para verificar o status do banco de dados.
Útil para debug de migrações e problemas de schema.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

from database.core.connection import get_db, engine

router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/database-status")
def get_database_status(db: Session = Depends(get_db)):
    """
    Verifica o status do banco de dados:
    - Conexão
    - Tabelas existentes
    - Colunas da tabela facebook_accounts
    - Migrações aplicadas
    """
    try:
        # 1. Testar conexão
        db.execute(text("SELECT 1"))
        connection_ok = True
    except Exception as e:
        return {
            "connection": "FAILED",
            "error": str(e),
        }

    # 2. Listar tabelas
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    # 3. Verificar colunas da tabela facebook_accounts
    facebook_accounts_columns = []
    if "facebook_accounts" in tables:
        columns = inspector.get_columns("facebook_accounts")
        facebook_accounts_columns = [
            {
                "name": col["name"],
                "type": str(col["type"]),
                "nullable": col["nullable"],
                "default": str(col.get("default", None)),
            }
            for col in columns
        ]

    # 4. Verificar se a coluna token_valid existe
    token_valid_exists = any(
        col["name"] == "token_valid" for col in facebook_accounts_columns
    )

    # 5. Listar migrações aplicadas
    applied_migrations = []
    if "_applied_migrations" in tables:
        try:
            result = db.execute(
                text(
                    "SELECT filename, applied_at, content_hash "
                    "FROM _applied_migrations ORDER BY applied_at DESC LIMIT 20"
                )
            )
            applied_migrations = [
                {
                    "filename": row[0],
                    "applied_at": str(row[1]),
                    "content_hash": row[2][:8] if row[2] else None,
                }
                for row in result
            ]
        except Exception as e:
            applied_migrations = [{"error": str(e)}]

    # 6. Contar registros em tabelas principais
    counts = {}
    for table in ["facebook_accounts", "gemini_account", "transactions", "companies"]:
        if table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                counts[table] = result.scalar()
            except Exception as e:
                counts[table] = f"ERROR: {str(e)}"

    return {
        "connection": "OK",
        "total_tables": len(tables),
        "tables": sorted(tables),
        "facebook_accounts": {
            "exists": "facebook_accounts" in tables,
            "token_valid_column_exists": token_valid_exists,
            "total_columns": len(facebook_accounts_columns),
            "columns": facebook_accounts_columns,
        },
        "migrations": {
            "tracking_table_exists": "_applied_migrations" in tables,
            "total_applied": len(applied_migrations),
            "recent_migrations": applied_migrations,
        },
        "record_counts": counts,
    }
