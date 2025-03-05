from mistralai import Mistral

class LLMClient:
    def __init__(self, api_key, model):
        self.mistral_client = Mistral(api_key=api_key)
        self.model = model

    def get_response(self, user_input, system_prompt, chat_history=[]):
        response = self.mistral_client.chat.complete(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_input,
                },
            ]
        )
        return response.choices[0].message.content