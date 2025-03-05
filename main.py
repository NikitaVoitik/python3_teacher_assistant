from flask import Flask, render_template, request, jsonify
from llm_api import LLMClient

class MyFlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.llm_client = LLMClient(api_key='s0bCxiZAttwKRcBbqdyHhLxpjUjRDZWO', model='mistral-large-latest')
        self.setup_routes()

    def setup_routes(self):
        @self.app.route('/')
        def home():
            return render_template('index.html')

        @self.app.route('/ask', methods=['POST'])
        def ask():
            data = request.json
            user_input = data.get('message')
            system_prompt = data.get('systemPrompt')
            response = self.llm_client.get_response(user_input, system_prompt)
            return jsonify({'response': response})

        @self.app.route('/reset', methods=['POST'])
        def reset():
            self.llm_client.reset_history()
            return jsonify({'status': 'history reset'})

    def run(self):
        self.app.run(debug=True)

if __name__ == '__main__':
    app_instance = MyFlaskApp()
    app_instance.run()