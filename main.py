from flask import Flask, render_template, request, jsonify

from configfile import apikey
from llm_api import LLMClient
from params import prompts


class MyFlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.llm_client = LLMClient(api_key=apikey, model='mistral-large-latest')
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
                file_content = file_upload.read().decode('utf-8')
                filename = file_upload.filename
                self.llm_client.add_file(filename, file_content)
                return jsonify({'status': 'ok'})
            return jsonify({'status': 'not ok'})

    def run(self):
        self.app.run(debug=True)


if __name__ == '__main__':
    app_instance = MyFlaskApp()
    app_instance.run()