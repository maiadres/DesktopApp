const path = require("path");
const { app, BrowserWindow, ipcMain } = require("electron");
const sqlite3 = require("sqlite3").verbose();

let win;

// Conectar a la base de datos SQLite
const db = new sqlite3.Database("clientes.db", (err) => {
  if (err) console.error("Error al conectar a la base de datos", err);
  else console.log("Conectado a la base de datos SQLite");
});

// Crear tabla si no existe
db.run(
  "CREATE TABLE IF NOT EXISTS clientes (dni TEXT PRIMARY KEY, nombre TEXT NOT NULL, domicilio TEXT, celular TEXT NOT NULL, estado TEXT CHECK(estado IN ('pendiente', 'pago')) NOT NULL)"
);

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.removeMenu();
  win.loadFile("index.html");
  
  // Para desarrollo, descomenta esta línea
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar la base de datos cuando la aplicación se cierra
app.on("before-quit", () => {
  db.close();
});

// Eventos IPC para interactuar con la base de datos
ipcMain.on("add-client", (event, client) => {
  db.run(
    "INSERT INTO clientes (dni, nombre, domicilio, celular, estado) VALUES (?, ?, ?, ?, ?)",
    [client.dni, client.nombre, client.domicilio, client.celular, client.estado],
    (err) => {
      if (err) {
        console.error("Error al insertar cliente", err);
        event.reply("client-error", err.message);
      } else {
        event.reply("client-added");
      }
    }
  );
});

ipcMain.on("get-clients", (event) => {
  db.all("SELECT * FROM clientes ORDER BY nombre", [], (err, rows) => {
    if (err) {
      console.error("Error al obtener clientes", err);
      event.reply("client-error", err.message);
    } else {
      event.reply("clients-list", rows);
    }
  });
});

ipcMain.on("get-client-by-dni", (event, dni) => {
  db.get("SELECT * FROM clientes WHERE dni = ?", [dni], (err, row) => {
    if (err) {
      console.error("Error al buscar cliente por DNI", err);
      event.reply("client-error", err.message);
      event.reply("client-found", null);
    } else {
      event.reply("client-found", row || null);
    }
  });
});

ipcMain.on("delete-client", (event, dni) => {
  db.run("DELETE FROM clientes WHERE dni = ?", [dni], (err) => {
    if (err) {
      console.error("Error al borrar cliente", err);
      event.reply("client-error", err.message);
    } else {
      event.reply("client-deleted");
    }
  });
});

ipcMain.on("edit-client", (event, client) => {
  console.log("Editando cliente:", client);
  db.run(
    "UPDATE clientes SET nombre = ?, domicilio = ?, celular = ?, estado = ? WHERE dni = ?",
    [client.nombre, client.domicilio, client.celular, client.estado, client.dni],
    (err) => {
      if (err) {
        console.error("Error al editar cliente", err);
        event.reply("client-error", err.message);
      } else {
        event.reply("client-edited");
      }
    }
  );
});

ipcMain.on("search-client", (event, searchTerm) => {
  db.all(
    "SELECT * FROM clientes WHERE nombre LIKE ? OR dni LIKE ? OR celular LIKE ?",
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`],
    (err, rows) => {
      if (err) {
        console.error("Error al buscar cliente", err);
        event.reply("client-error", err.message);
      } else {
        event.reply("clients-search-results", rows);
      }
    }
  );
});