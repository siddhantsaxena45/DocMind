import httpx
import base64
from app.core.config import settings, api_key_rotator

class ImageGenerator:
    def __init__(self):
        # We will use the HuggingFace Inference API with a free model
        self.api_url = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"

    async def generate_image(self, prompt: str) -> str:
        hf_keys = api_key_rotator.get_rotated_hf_keys()
        
        if not hf_keys:
            raise Exception("HUGGINGFACE_API_KEY is not set. Image generation requires an API token from HuggingFace.")

        last_error = ""
        for attempt, current_key in enumerate(hf_keys):
            headers = {"Authorization": f"Bearer {current_key}"}
            payload = {"inputs": prompt}
            
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(self.api_url, headers=headers, json=payload)
                    
                    if response.status_code == 200:
                        img_b64 = base64.b64encode(response.content).decode("utf-8")
                        return f"data:image/jpeg;base64,{img_b64}"
                    
                    error_detail = response.text
                    # Check for rate limits or invalid keys
                    if response.status_code == 429 or "Rate limit" in error_detail or "too many requests" in error_detail.lower():
                        print(f"[Warning] HF Key {attempt + 1}/{len(hf_keys)} exhausted. Rotating...")
                        last_error = error_detail
                        continue
                    if response.status_code == 401 or "invalid" in error_detail.lower():
                        print(f"[Warning] HF Key {attempt + 1}/{len(hf_keys)} invalid. Rotating...")
                        last_error = error_detail
                        continue
                        
                    if "Model is loading" in error_detail:
                        raise Exception("The Image AI model is currently warming up on HuggingFace. Please try again in 1 minute.")
                    
                    raise Exception(f"Image generation failed: {error_detail}")
            except Exception as e:
                if attempt < len(hf_keys) - 1:
                    last_error = str(e)
                    continue
                raise e

        raise Exception(f"All Hugging Face tokens exhausted or failed: {last_error}")

image_generator = ImageGenerator()
