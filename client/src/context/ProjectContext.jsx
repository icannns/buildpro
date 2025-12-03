import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { message } from 'antd';

const ProjectContext = createContext();

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');
            if (response.data.success) {
                const projectsList = response.data.data;
                setProjects(projectsList);

                // Set first project as active by default
                if (projectsList.length > 0 && !activeProject) {
                    setActiveProject(projectsList[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            message.error('Gagal memuat data proyek');
        } finally {
            setLoading(false);
        }
    };

    const switchProject = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setActiveProject(project);
            message.success(`Beralih ke proyek: ${project.name}`);
        }
    };

    const refreshActiveProject = async () => {
        if (!activeProject) return;

        try {
            const response = await api.get(`/projects/${activeProject.id}`);
            if (response.data.success) {
                setActiveProject(response.data.data);
                // Also update in projects array
                setProjects(prev => prev.map(p =>
                    p.id === response.data.data.id ? response.data.data : p
                ));
            }
        } catch (error) {
            console.error('Error refreshing project:', error);
        }
    };

    const createProject = async (projectData) => {
        try {
            const response = await api.post('/projects', projectData);
            if (response.data.success) {
                // Refresh projects list
                await fetchProjects();
                // Switch to newly created project  
                const newProjectId = response.data.data.id;
                const updatedProjects = await api.get('/projects');
                const newProject = updatedProjects.data.data.find(p => p.id === newProjectId);
                if (newProject) {
                    setActiveProject(newProject);
                }
                message.success(`Proyek "${response.data.data.name}" berhasil dibuat!`);
                return { success: true, data: response.data.data };
            }
            return { success: false };
        } catch (error) {
            console.error('Error creating project:', error);
            message.error('Gagal membuat proyek');
            return { success: false, error };
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            const response = await api.put(`/projects/${projectId}`, projectData);
            if (response.data.success) {
                // Refresh projects list
                await fetchProjects();
                // Refresh active project if it's the one being updated
                if (activeProject?.id === projectId) {
                    setActiveProject(response.data.data);
                }
                message.success('Proyek berhasil diupdate!');
                return { success: true, data: response.data.data };
            }
            return { success: false };
        } catch (error) {
            console.error('Error updating project:', error);
            message.error('Gagal mengupdate proyek');
            return { success: false, error };
        }
    };

    const value = {
        projects,
        activeProject,
        loading,
        switchProject,
        refreshActiveProject,
        fetchProjects,
        createProject,
        updateProject
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export default ProjectContext;
