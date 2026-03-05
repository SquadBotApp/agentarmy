"""
AgentArmyOS Persistence Layer
SQLite-based storage for jobs, universes, providers, and metrics
"""
import sqlite3
import json
import time
from typing import Dict, List, Any, Optional
from pathlib import Path

DB_PATH = Path(__file__).parent / "agentarmy.db"

def init_db():
    """Initialize the database with tables"""
    conn = sqlite3.connect(str(DB_PATH))
    c = conn.cursor()
    
    # Jobs table
    c.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            input_data TEXT,
            status TEXT,
            result TEXT,
            created_at REAL,
            updated_at REAL
        )
    """)
    
    # Universe runs table
    c.execute("""
        CREATE TABLE IF NOT EXISTS universe_runs (
            run_id TEXT PRIMARY KEY,
            job_id TEXT,
            strategy TEXT,
            score REAL,
            output TEXT,
            created_at REAL
        )
    """)
    
    # Provider usage table
    c.execute("""
        CREATE TABLE IF NOT EXISTS provider_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider TEXT,
            latency_ms REAL,
            cost_usd REAL,
            success INTEGER,
            created_at REAL
        )
    """)
    
    # Metrics table
    c.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT,
            metric_value REAL,
            created_at REAL
        )
    """)
    
    # Agents table
    c.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            agent_id TEXT PRIMARY KEY,
            name TEXT,
            status TEXT,
            created_at REAL
        )
    """)
    
    conn.commit()
    conn.close()

class Database:
    def __init__(self):
        self.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
    
    def close(self):
        self.conn.close()
    
    # Jobs
    def create_job(self, job_id: str, input_data: str) -> None:
        now = time.time()
        self.conn.execute(
            "INSERT INTO jobs (job_id, input_data, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (job_id, input_data, "pending", now, now)
        )
        self.conn.commit()
    
    def update_job(self, job_id: str, status: str, result: Any = None) -> None:
        now = time.time()
        result_json = json.dumps(result) if result else None
        self.conn.execute(
            "UPDATE jobs SET status = ?, result = ?, updated_at = ? WHERE job_id = ?",
            (status, result_json, now, job_id)
        )
        self.conn.commit()
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        c = self.conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = c.fetchone()
        return dict(row) if row else None
    
    def list_jobs(self, limit: int = 100) -> List[Dict]:
        c = self.conn.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,))
        return [dict(row) for row in c.fetchall()]
    
    # Universe runs
    def save_universe_run(self, run_id: str, job_id: str, strategy: str, score: float, output: Any) -> None:
        now = time.time()
        self.conn.execute(
            "INSERT INTO universe_runs (run_id, job_id, strategy, score, output, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (run_id, job_id, strategy, score, json.dumps(output), now)
        )
        self.conn.commit()
    
    def get_universe_runs(self, job_id: str) -> List[Dict]:
        c = self.conn.execute("SELECT * FROM universe_runs WHERE job_id = ?", (job_id,))
        return [dict(row) for row in c.fetchall()]
    
    # Provider usage
    def record_provider_usage(self, provider: str, latency_ms: float, cost_usd: float, success: bool) -> None:
        now = time.time()
        self.conn.execute(
            "INSERT INTO provider_usage (provider, latency_ms, cost_usd, success, created_at) VALUES (?, ?, ?, ?, ?)",
            (provider, latency_ms, cost_usd, 1 if success else 0, now)
        )
        self.conn.commit()
    
    def get_provider_stats(self) -> List[Dict]:
        c = self.conn.execute("""
            SELECT provider, 
                   AVG(latency_ms) as avg_latency,
                   SUM(cost_usd) as total_cost,
                   AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate
            FROM provider_usage 
            GROUP BY provider
        """)
        return [dict(row) for row in c.fetchall()]
    
    # Metrics
    def record_metric(self, metric_name: str, metric_value: float) -> None:
        now = time.time()
        self.conn.execute(
            "INSERT INTO metrics (metric_name, metric_value, created_at) VALUES (?, ?, ?)",
            (metric_name, metric_value, now)
        )
        self.conn.commit()
    
    def get_metrics(self, metric_name: str = None) -> List[Dict]:
        if metric_name:
            c = self.conn.execute(
                "SELECT * FROM metrics WHERE metric_name = ? ORDER BY created_at DESC",
                (metric_name,)
            )
        else:
            c = self.conn.execute("SELECT * FROM metrics ORDER BY created_at DESC")
        return [dict(row) for row in c.fetchall()]
    
    # Agents
    def register_agent(self, agent_id: str, name: str) -> None:
        now = time.time()
        self.conn.execute(
            "INSERT OR REPLACE INTO agents (agent_id, name, status, created_at) VALUES (?, ?, ?, ?)",
            (agent_id, name, "active", now)
        )
        self.conn.commit()
    
    def list_agents(self) -> List[Dict]:
        c = self.conn.execute("SELECT * FROM agents")
        return [dict(row) for row in c.fetchall()]

# Global database instance
db = None

def get_db() -> Database:
    global db
    if db is None:
        db = Database()
    return db

# Initialize on import
init_db()

