import axiosInstance from "./axiosinstance";
import {
  documentListAdd,
  documentListUpdate,
  documentListGet,
  documentListDelete,
} from "../api/api";

const documentService = {
  // GET /document-list/get
  getDocumentList: async () => {
    try {
      const res = await axiosInstance.get(documentListGet);
      return res.data?.data || [];
    } catch (err) {
      console.error("Error in getDocumentList:", err.response || err);
      throw err;
    }
  },

  // POST /document-list/add  { name }
  addDocument: async (name) => {
    try {
      const res = await axiosInstance.post(documentListAdd, { name });
      return res.data;
    } catch (err) {
      console.error("Error in addDocument:", err.response || err);
      throw err;
    }
  },

  // PUT /document-list/update/{id}  { name }
  updateDocument: async (id, name) => {
    try {
      const res = await axiosInstance.put(`${documentListUpdate}/${id}`, {
        name,
      });
      return res.data;
    } catch (err) {
      console.error("Error in updateDocument:", err.response || err);
      throw err;
    }
  },

  // DELETE /document-list/delete/{id}
  deleteDocument: async (id) => {
    try {
      const res = await axiosInstance.delete(`${documentListDelete}/${id}`);
      return res.data;
    } catch (err) {
      console.error("Error in deleteDocument:", err.response || err);
      throw err;
    }
  },
};

export default documentService;
