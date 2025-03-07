import base64
import json

import requests

from configfile import ocr_apikey


class RapidAPITextExtractor:
    def __init__(self):
        self.api_key = ocr_apikey
        self.api_host = "ocr-extract-text.p.rapidapi.com"
        self.url = "https://ocr-extract-text.p.rapidapi.com/ocr"

    def extract_text_from_image(self, image_path):
        try:
            with open(image_path, "rb") as image_file:
                encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

            headers = {'x-rapidapi-key': self.api_key, 'x-rapidapi-host': self.api_host,
                'Content-Type': "application/x-www-form-urlencoded"}

            payload = {"base64": encoded_string}
            response = requests.post(self.url, data=payload, headers=headers)

            if response.status_code == 200:
                try:
                    result = response.json()
                    return result.get("text", "")
                except json.JSONDecodeError:
                    return response.text
            else:
                return f"[API Error: {response.status_code}] {response.text}"

        except Exception as e:
            print(f"OCR API error: {str(e)}")
            return f"[Error extracting text: {str(e)}]"
