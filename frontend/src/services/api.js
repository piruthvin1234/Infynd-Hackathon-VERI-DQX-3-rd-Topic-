import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const signup = (data) => API.post("/auth/signup", data);

export const login = (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);
  return API.post("/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

// Data Processing API - Auto clean mode
export const uploadCSV = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/upload-and-clean/", formData);
};

// Human-in-the-loop Review APIs
export const uploadForReview = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/upload-for-review/", formData);
};

export const getReviewData = (sessionId, filters = null) => {
  return API.get(`/review/${sessionId}`, { params: { filters } });
};

export const getReviewStats = (sessionId) => {
  return API.get(`/review/${sessionId}/stats`);
};

export const applyReviewChanges = (sessionId, changes) => {
  return API.post(`/review/${sessionId}/apply`, {
    session_id: sessionId,
    changes: changes,
  });
};

export const getChangelog = (sessionId) => {
  return API.get(`/changelog/${sessionId}`);
};

// ============== PROJECT APIs ==============

export const createProject = (projectData, userId) => {
  return API.post(`/api/projects/`, {
    ...projectData,
    user_id: userId
  });
};

export const getProjects = (userId, skip = 0, limit = 20, includeInactive = false) => {
  return API.get(`/api/projects/`, {
    params: { user_id: userId, skip, limit, include_inactive: includeInactive }
  });
};

export const getProject = (projectId) => {
  return API.get(`/api/projects/${projectId}`);
};

export const updateProject = (projectId, updateData) => {
  return API.put(`/api/projects/${projectId}`, updateData);
};

export const deleteProject = (projectId, hardDelete = false) => {
  return API.delete(`/api/projects/${projectId}`, {
    params: { hard_delete: hardDelete }
  });
};

// ============== RUN APIs ==============

export const getProjectRuns = (projectId, skip = 0, limit = 50) => {
  return API.get(`/api/projects/${projectId}/runs`, {
    params: { skip, limit }
  });
};

export const getRun = (projectId, runId) => {
  return API.get(`/api/projects/${projectId}/runs/${runId}`);
};

export const getRunDataPreview = (projectId, runId, type = "cleaned", limit = 50, offset = 0, filters = null) =>
  API.get(`/api/projects/${projectId}/runs/${runId}/data`, { params: { type, limit, offset, filters } });

export const uploadToProject = (projectId, file, mode = "auto", runBy = null) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post(`/api/projects/${projectId}/runs/upload`, formData, {
    params: { mode, run_by: runBy }
  });
};

export const updateRunNotes = (projectId, runId, notes) => {
  return API.patch(`/api/projects/${projectId}/runs/${runId}/notes`, { notes });
};

export const deleteRun = (projectId, runId) => {
  return API.delete(`/api/projects/${projectId}/runs/${runId}`);
};

// ============== COMPARISON & TIMELINE APIs ==============

export const compareRuns = (projectId, runId1, runId2) => {
  return API.post(`/api/projects/${projectId}/compare`, {
    run_id_1: runId1,
    run_id_2: runId2
  });
};

export const getProjectTimeline = (projectId) => {
  return API.get(`/api/projects/${projectId}/timeline`);
};


// ============== NEW VERIFICATION APIs ==============

export const sendEmailVerification = (email) => API.post("/auth/email/request", { email });

export const verifyEmailToken = (token) => API.post("/auth/email/verify", { token });

export const sendOTP = (phoneNumber) => API.post("/auth/phone/otp", { phone_number: phoneNumber });

export const verifyOTP = (phoneNumber, code) => API.post("/auth/phone/verify", { phone_number: phoneNumber, otp_code: code });


// ============== NEW FILE WORKFLOW APIs ==============

export const uploadFiles = (files, projectId) => {
    const formData = new FormData();
    // Support either FileList array or single file
    if (files.length) {
        Array.from(files).forEach((file) => formData.append("files", file));
    } else {
        formData.append("files", files);
    }
    
    return API.post("/files/upload", formData, {
        params: { project_id: projectId }
    });
};

export const analyzeFile = (fileId) => API.post(`/files/${fileId}/analyze`);

export const getFileReviewData = (fileId, page=1, pageSize=50, filters=null) => 
    API.get(`/files/${fileId}/review`, { params: { page, page_size: pageSize, filters } });

export const submitReviewDecisions = (fileId, decisions) => 
    API.post(`/files/${fileId}/review/bulk`, { decisions }); 

export const finalizeFileCleaning = (fileId) => API.post(`/files/${fileId}/clean`);

export const getFileCleanedData = (fileId, page=1, pageSize=50, filters=null) => 
    API.get(`/files/${fileId}/cleaned`, { params: { page, page_size: pageSize, filters } });

export default API;



