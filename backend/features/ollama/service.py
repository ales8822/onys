import httpx

def get_remote_ollama_models(base_url: str):
    """
    Connects to the RunPod/Ollama URL and fetches available models.
    """
    if not base_url:
        return ["error-no-url"]

    # Clean the URL (remove trailing slash) and add the API endpoint
    clean_url = base_url.rstrip("/")
    api_url = f"{clean_url}/api/tags"

    try:
        # We use a timeout so it doesn't hang forever if RunPod is off
        response = httpx.get(api_url, timeout=5.0)
        
        if response.status_code == 200:
            data = response.json()
            # Ollama returns format: { "models": [ { "name": "llama3" }, ... ] }
            return [m["name"] for m in data.get("models", [])]
            
        return ["error-runpod-unreachable"]
        
    except Exception as e:
        print(f"Error fetching Ollama models: {e}")
        return ["connection-failed"]