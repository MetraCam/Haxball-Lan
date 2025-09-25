import asyncio
import websockets
import http.server
import socketserver
import threading

PORT = 8000
WS_PORT = 3000
clientes = set()

# Servidor HTTP para servir el HTML
def run_http_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Servidor HTTP en puerto {PORT}")
        httpd.serve_forever()

# Servidor WebSocket para el chat
async def echo(websocket):
    print("Nuevo cliente conectado")
    clientes.add(websocket)
    try:
        async for message in websocket:
            print("Mensaje:", message)
            for client in clientes:
                await client.send(message)
    finally:
        clientes.remove(websocket)

async def run_websocket_server():
    async with websockets.serve(echo, "0.0.0.0", WS_PORT):
        print(f"Servidor WebSocket en puerto {WS_PORT}")
        await asyncio.Future()  # Mantiene el servidor corriendo


# Iniciar ambos servidores

threading.Thread(target=run_http_server, daemon=True).start()
asyncio.run(run_websocket_server())