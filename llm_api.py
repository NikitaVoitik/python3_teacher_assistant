from mistralai import Mistral


class LLMClient:
    def __init__(self, api_key, model):
        self.mistral_client = Mistral(api_key=api_key)
        self.model = model
        self.chat_history = []

    def get_response(self, user_input, system_prompt):
        self.chat_history.append({"role": "user", "content": user_input})
        messages = [{"role": "system", "content": system_prompt}] + self.chat_history
        response = self.mistral_client.chat.complete(model=self.model, messages=messages)
        response_content = response.choices[0].message.content
        self.chat_history.append({"role": "assistant", "content": response_content})
        return response_content

    def add_file(self, file_name, file_content):
        prefix = f"Filename: {file_name}\nFile Content:\n"
        self.chat_history.append({"role": "user", "content": prefix + file_content})

    def add_image(self, image):
        if self.model != "pixtral-large-latest":
            self.model = "pixtral-large-latest"
        if isinstance(image, bytes):
            image = image.decode('utf-8')
        self.chat_history.append({"role": "user",
            "content": [{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}]})

    def add_message(self, message):
        self.chat_history.append({"role": "user", "content": message})

    def reset_history(self):
        self.chat_history = []
