"""
Adapter for Local LLMs (offline/air-gapped operation)
Implements UniversalAgentInterface for local model inference (e.g., llama.cpp, ollama, GPT4All, etc.)
"""
from ..universal_agent_interface import UniversalAgentInterface
import subprocess
import os

class LocalLLMAdapter(UniversalAgentInterface):
    def __init__(self, name="local-llm", config=None):
        self.name = name
        self.config = config or {}
        self.model_path = self.config.get("model_path", os.getenv("LOCAL_LLM_MODEL_PATH", "./models/llama.bin"))
        self.backend = self.config.get("backend", os.getenv("LOCAL_LLM_BACKEND", "llama.cpp"))

    def step(self, prompt, **kwargs):
        # Example: call llama.cpp or ollama via subprocess
        if self.backend == "llama.cpp":
            cmd = f"llama.cpp -m {self.model_path} -p \"{prompt}\" --n-predict 256"
        elif self.backend == "ollama":
            cmd = f"ollama run {self.model_path} --prompt \"{prompt}\""
        elif self.backend == "gpt4all":
            cmd = f"gpt4all --model {self.model_path} --prompt \"{prompt}\""
        else:
            return {"error": f"Unknown backend: {self.backend}"}
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except Exception as e:
            return {"error": str(e)}

    def shutdown(self):
        pass
