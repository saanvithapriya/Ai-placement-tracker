import api from './axios';

export const getAdminStats = () => api.get('/admin/stats');
export const getStudents = (params) => api.get('/admin/students', { params });
export const getCompanies = () => api.get('/admin/companies');
export const createCompany = (data) => api.post('/admin/companies', data);
export const updateCompany = (id, data) => api.put(`/admin/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/admin/companies/${id}`);
export const getDrives = () => api.get('/admin/drives');
export const getDriveApplicants = (driveId) => api.get(`/admin/drives/${driveId}/applicants`);
export const updateApplicantStatus = (driveId, userId, status) =>
  api.put(`/admin/drives/${driveId}/applicants/${userId}/status`, { status });
