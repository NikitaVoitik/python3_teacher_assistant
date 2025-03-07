import base64
from io import BytesIO

from PIL import Image
from PyPDF2 import PdfReader
from flask import Flask, render_template, request, jsonify

from configfile import mistral_apikey
from llm_api import LLMClient
from params import prompts


class MyFlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.llm_client = LLMClient(api_key=mistral_apikey, model='mistral-large-latest')
        self.setup_routes()

    def setup_routes(self):
        @self.app.route('/')
        def home():
            return render_template('index.html')

        @self.app.route('/ask', methods=['POST'])
        def ask():
            data = request.json
            user_input = data.get('message')
            prompt_type = data.get('prompt_type')
            system_prompt = prompts.get(prompt_type)
            print(self.llm_client.chat_history)
            print()
            response = self.llm_client.get_response(user_input, system_prompt)
            return jsonify({'response': response})

        @self.app.route('/reset', methods=['POST'])
        def reset():
            self.llm_client.reset_history()
            return jsonify({'status': 'history reset'})

        @self.app.route('/file', methods=['POST'])
        def file():
            file_upload = request.files['file']
            if file_upload:
                filename = file_upload.filename
                content = ""

                image_extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp']
                is_image = any(filename.lower().endswith(ext) for ext in image_extensions)
                if is_image:
                    try:
                        image = Image.open(file_upload)
                        image = image.convert('RGB')

                        buffered = BytesIO()
                        image.save(buffered, format="JPEG")
                        img_str = base64.b64encode(buffered.getvalue())
                        self.llm_client.add_image(img_str)
                    except Exception as e:
                        return jsonify({'status': 'error', 'message': f'Error processing image: {str(e)}'})
                elif filename.lower().endswith('.pdf'):
                    try:
                        pdf = PdfReader(file_upload)
                        for page in pdf.pages:
                            content += page.extract_text() + "\n"
                        self.llm_client.add_file(filename, content)
                    except Exception as e:
                        return jsonify({'status': 'error', 'message': f'Error reading PDF: {str(e)}'})
                else:
                    try:
                        content = file_upload.read().decode('utf-8')
                        self.llm_client.add_file(filename, content)
                    except UnicodeDecodeError:
                        return jsonify({'status': 'error', 'message': 'File encoding not supported'})

                return jsonify({'status': 'ok'})
            return jsonify({'status': 'not ok'})

    def run(self):
        self.app.run(debug=True)


if __name__ == '__main__':
    app_instance = MyFlaskApp()
    app_instance.run()
