const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Agregar un cliente
  addClient: (client) => ipcRenderer.send("add-client", client),

  // Escuchar cuando un cliente ha sido agregado
  onClientAdded: (callback) => {
    ipcRenderer.removeAllListeners("client-added");
    ipcRenderer.on("client-added", () => callback());
  },

  // Obtener la lista de clientes
  getClients: (callback) => {
    ipcRenderer.removeAllListeners("clients-list");
    ipcRenderer.on("clients-list", (event, data) => callback(data));
  },

  // Solicitar la lista de clientes
  requestClients: () => ipcRenderer.send("get-clients"),

  // Buscar un cliente específico por DNI
  getClientByDNI: (dni, callback) => {
    ipcRenderer.removeAllListeners("client-found");
    ipcRenderer.once("client-found", (event, cliente) => callback(cliente));
    ipcRenderer.send("get-client-by-dni", dni);
  },

  // Actualizar un cliente
  updateClient: (client) => ipcRenderer.send("edit-client", client),

  // Escuchar cuando un cliente ha sido editado
  onClientEdited: (callback) => {
    ipcRenderer.removeAllListeners("client-edited");
    ipcRenderer.on("client-edited", () => callback());
  },

  // Eliminar un cliente
  deleteClient: (dni) => ipcRenderer.send("delete-client", dni),

  // Escuchar cuando un cliente ha sido eliminado
  onClientDeleted: (callback) => {
    ipcRenderer.removeAllListeners("client-deleted");
    ipcRenderer.on("client-deleted", () => callback());
  },

  // Buscar clientes
  searchClients: (searchTerm) => ipcRenderer.send("search-client", searchTerm),

  // Recibir los resultados de búsqueda
  getSearchResults: (callback) => {
    ipcRenderer.removeAllListeners("clients-search-results");
    ipcRenderer.on("clients-search-results", (event, data) => callback(data));
  },

  // Escuchar errores
  onClientError: (callback) => {
    ipcRenderer.removeAllListeners("client-error");
    ipcRenderer.on("client-error", (event, error) => callback(error));
  }
});