from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
import os

app = Flask(__name__)
CORS(app)

app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/health')
def health():
    return {'status': 'ok', 'service': 'ml-service'}

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)