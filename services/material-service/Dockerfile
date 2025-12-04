FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt* ./
RUN pip install flask flask-cors mysql-connector-python

COPY . .

EXPOSE 5002

ENV PYTHONUNBUFFERED=1

CMD ["python", "app.py"]
