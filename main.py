from flask import Flask, render_template

class MyFlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        self.setup_routes()

    def setup_routes(self):
        @self.app.route('/')
        def home():
            return render_template('index.html')

    def run(self):
        self.app.run(debug=True)

if __name__ == '__main__':
    app_instance = MyFlaskApp()
    app_instance.run()